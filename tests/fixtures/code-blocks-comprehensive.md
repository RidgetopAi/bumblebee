# Code Blocks Comprehensive Test Fixtures

This file contains test fixtures for all 18 languages supported by Bumblebee's Shiki integration. Used for comprehensive testing and performance benchmarking.

## TypeScript (Eager Language)

```typescript
// Basic TypeScript syntax with interfaces and generics
interface User {
  readonly id: number;
  name: string;
  email?: string;
  roles: string[];
}

class UserService<T extends User> {
  private users: Map<number, T> = new Map();

  async create(user: Omit<T, 'id'>): Promise<T> {
    const id = Math.random();
    const newUser = { ...user, id } as T;
    this.users.set(id, newUser);
    return newUser;
  }

  findById(id: number): T | undefined {
    return this.users.get(id);
  }

  async update(id: number, updates: Partial<T>): Promise<T | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }
}

// Advanced TypeScript features
type ApiResponse<T> = {
  data: T;
  error?: string;
  status: 'success' | 'error';
};

const fetchUser = async (id: number): Promise<ApiResponse<User>> => {
  try {
    const user = userService.findById(id);
    return { data: user!, status: 'success' };
  } catch (error) {
    return { error: error.message, status: 'error' };
  }
};

// Decorators and metadata
function logged(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${propertyKey} with args:`, args);
    return original.apply(this, args);
  };
}
```

## JavaScript (Eager Language)

```javascript
// Modern JavaScript with ES6+ features
const userService = {
  users: new Map(),

  async create(userData) {
    const id = crypto.randomUUID();
    const user = { ...userData, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  },

  findById(id) {
    return this.users.get(id);
  },

  async update(id, updates) {
    const user = this.users.get(id);
    if (!user) return null;

    Object.assign(user, updates, { updatedAt: new Date() });
    return user;
  },

  *getAllUsers() {
    for (const [id, user] of this.users) {
      yield { id, ...user };
    }
  }
};

// Async iteration and modern syntax
async function processUsers() {
  const results = [];
  for await (const user of userService.getAllUsers()) {
    results.push(user);
  }
  return results;
}

// Dynamic imports and top-level await
const { readFile, writeFile } = await import('fs/promises');

// Optional chaining and nullish coalescing
const config = {
  database: process.env.DB_URL ?? 'postgresql://localhost:5432/default',
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000
};

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
```

## Python (Eager Language)

```python
# Type hints and dataclasses
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncio
import json

@dataclass
class User:
    id: int
    name: str
    email: Optional[str] = None
    roles: List[str] = None
    created_at: datetime = None

    def __post_init__(self):
        if self.roles is None:
            self.roles = []
        if self.created_at is None:
            self.created_at = datetime.now()

class UserService:
    def __init__(self):
        self.users: Dict[int, User] = {}

    async def create(self, user_data: Dict[str, Any]) -> User:
        user_id = len(self.users) + 1
        user = User(id=user_id, **user_data)
        self.users[user_id] = user
        return user

    def find_by_id(self, user_id: int) -> Optional[User]:
        return self.users.get(user_id)

    async def update(self, user_id: int, updates: Dict[str, Any]) -> Optional[User]:
        user = self.users.get(user_id)
        if not user:
            return None

        for key, value in updates.items():
            if hasattr(user, key):
                setattr(user, key, value)

        user.created_at = datetime.now()  # Update timestamp
        return user

    def get_all_users(self):
        return list(self.users.values())

# Async context manager
class DatabaseConnection:
    async def __aenter__(self):
        print("Connecting to database...")
        await asyncio.sleep(0.1)  # Simulate connection
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("Closing database connection...")
        await asyncio.sleep(0.1)  # Simulate cleanup

    async def execute(self, query: str) -> List[Dict]:
        # Simulate database query
        return [{"id": 1, "name": "Test User"}]

# Usage example
async def main():
    async with DatabaseConnection() as db:
        users = await db.execute("SELECT * FROM users")
        print(f"Found {len(users)} users")

if __name__ == "__main__":
    asyncio.run(main())
```

## Rust (Eager Language)

```rust
// Comprehensive Rust example with advanced features
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Serialize, Deserialize};
use anyhow::{Result, Context};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct User {
    id: u64,
    name: String,
    email: Option<String>,
    roles: Vec<String>,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug)]
struct UserService {
    users: Arc<RwLock<HashMap<u64, User>>>,
}

impl UserService {
    fn new() -> Self {
        Self {
            users: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    async fn create(&self, user_data: CreateUserRequest) -> Result<User> {
        let mut users = self.users.write().await;
        let id = users.len() as u64 + 1;

        let user = User {
            id,
            name: user_data.name,
            email: user_data.email,
            roles: user_data.roles.unwrap_or_default(),
            created_at: chrono::Utc::now(),
        };

        users.insert(id, user.clone());
        Ok(user)
    }

    async fn find_by_id(&self, id: u64) -> Option<User> {
        let users = self.users.read().await;
        users.get(&id).cloned()
    }

    async fn update(&self, id: u64, updates: UpdateUserRequest) -> Result<Option<User>> {
        let mut users = self.users.write().await;

        if let Some(user) = users.get_mut(&id) {
            if let Some(name) = updates.name {
                user.name = name;
            }
            if let Some(email) = updates.email {
                user.email = email;
            }
            if let Some(roles) = updates.roles {
                user.roles = roles;
            }

            Ok(Some(user.clone()))
        } else {
            Ok(None)
        }
    }

    async fn get_all_users(&self) -> Vec<User> {
        let users = self.users.read().await;
        users.values().cloned().collect()
    }
}

#[derive(Debug, Deserialize)]
struct CreateUserRequest {
    name: String,
    email: Option<String>,
    roles: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct UpdateUserRequest {
    name: Option<String>,
    email: Option<String>,
    roles: Option<Vec<String>>,
}

// Error handling with custom error types
#[derive(Debug, thiserror::Error)]
enum UserError {
    #[error("User not found: {id}")]
    NotFound { id: u64 },
    #[error("Validation error: {message}")]
    Validation { message: String },
    #[error(transparent)]
    Database(#[from] sqlx::Error),
}

// Async trait for service interface
#[async_trait::async_trait]
trait UserRepository {
    async fn save(&self, user: User) -> Result<(), UserError>;
    async fn find_by_id(&self, id: u64) -> Result<User, UserError>;
    async fn find_all(&self) -> Result<Vec<User>, UserError>;
}

// Implementation using generics and associated types
struct InMemoryUserRepository {
    storage: Arc<RwLock<HashMap<u64, User>>>,
}

#[async_trait::async_trait]
impl UserRepository for InMemoryUserRepository {
    async fn save(&self, user: User) -> Result<(), UserError> {
        let mut storage = self.storage.write().await;
        storage.insert(user.id, user);
        Ok(())
    }

    async fn find_by_id(&self, id: u64) -> Result<User, UserError> {
        let storage = self.storage.read().await;
        storage.get(&id)
            .cloned()
            .ok_or(UserError::NotFound { id })
    }

    async fn find_all(&self) -> Result<Vec<User>, UserError> {
        let storage = self.storage.read().await;
        Ok(storage.values().cloned().collect())
    }
}

// Pattern matching and comprehensive error handling
async fn handle_user_request(repo: &dyn UserRepository, request: UserRequest) -> Result<UserResponse> {
    match request {
        UserRequest::Create(req) => {
            let user = User {
                id: 0, // Will be set by repository
                name: req.name,
                email: req.email,
                roles: req.roles,
                created_at: chrono::Utc::now(),
            };

            repo.save(user.clone()).await?;
            Ok(UserResponse::Created(user))
        }

        UserRequest::Get(id) => {
            let user = repo.find_by_id(id).await?;
            Ok(UserResponse::Found(user))
        }

        UserRequest::List => {
            let users = repo.find_all().await?;
            Ok(UserResponse::List(users))
        }
    }
}

#[derive(Debug)]
enum UserRequest {
    Create(CreateUserRequest),
    Get(u64),
    List,
}

#[derive(Debug)]
enum UserResponse {
    Created(User),
    Found(User),
    List(Vec<User>),
}
```

## Go (Eager Language)

```go
// Comprehensive Go example with advanced features
package main

import (
    "context"
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "sync"
    "time"

    "github.com/google/uuid"
    _ "github.com/lib/pq"
)

// User represents a user in the system
type User struct {
    ID        uuid.UUID `json:"id" db:"id"`
    Name      string    `json:"name" db:"name"`
    Email     *string   `json:"email,omitempty" db:"email"`
    Roles     []string  `json:"roles" db:"roles"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
    UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// UserService provides user management functionality
type UserService struct {
    db *sql.DB
    mu sync.RWMutex
}

// NewUserService creates a new user service
func NewUserService(db *sql.DB) *UserService {
    return &UserService{db: db}
}

// CreateUserRequest represents a request to create a user
type CreateUserRequest struct {
    Name  string   `json:"name" validate:"required,min=2,max=100"`
    Email *string  `json:"email,omitempty" validate:"omitempty,email"`
    Roles []string `json:"roles,omitempty"`
}

// Create creates a new user
func (s *UserService) Create(ctx context.Context, req CreateUserRequest) (*User, error) {
    s.mu.Lock()
    defer s.mu.Unlock()

    user := &User{
        ID:        uuid.New(),
        Name:      req.Name,
        Email:     req.Email,
        Roles:     req.Roles,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }

    if user.Roles == nil {
        user.Roles = []string{"user"}
    }

    // Insert into database
    query := `
        INSERT INTO users (id, name, email, roles, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
    `

    rolesJSON, err := json.Marshal(user.Roles)
    if err != nil {
        return nil, fmt.Errorf("failed to marshal roles: %w", err)
    }

    _, err = s.db.ExecContext(ctx, query,
        user.ID, user.Name, user.Email, rolesJSON, user.CreatedAt, user.UpdatedAt)
    if err != nil {
        return nil, fmt.Errorf("failed to create user: %w", err)
    }

    return user, nil
}

// FindByID finds a user by ID
func (s *UserService) FindByID(ctx context.Context, id uuid.UUID) (*User, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()

    query := `
        SELECT id, name, email, roles, created_at, updated_at
        FROM users WHERE id = $1
    `

    var user User
    var rolesJSON []byte

    err := s.db.QueryRowContext(ctx, query, id).Scan(
        &user.ID, &user.Name, &user.Email, &rolesJSON,
        &user.CreatedAt, &user.UpdatedAt)
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, fmt.Errorf("user not found: %w", err)
        }
        return nil, fmt.Errorf("failed to find user: %w", err)
    }

    if err := json.Unmarshal(rolesJSON, &user.Roles); err != nil {
        return nil, fmt.Errorf("failed to unmarshal roles: %w", err)
    }

    return &user, nil
}

// UpdateUserRequest represents a request to update a user
type UpdateUserRequest struct {
    Name  *string  `json:"name,omitempty" validate:"omitempty,min=2,max=100"`
    Email *string  `json:"email,omitempty" validate:"omitempty,email"`
    Roles []string `json:"roles,omitempty"`
}

// Update updates an existing user
func (s *UserService) Update(ctx context.Context, id uuid.UUID, req UpdateUserRequest) (*User, error) {
    s.mu.Lock()
    defer s.mu.Unlock()

    // First find the user
    user, err := s.FindByID(ctx, id)
    if err != nil {
        return nil, err
    }

    // Apply updates
    if req.Name != nil {
        user.Name = *req.Name
    }
    if req.Email != nil {
        user.Email = req.Email
    }
    if req.Roles != nil {
        user.Roles = req.Roles
    }
    user.UpdatedAt = time.Now()

    // Update in database
    query := `
        UPDATE users SET name = $1, email = $2, roles = $3, updated_at = $4
        WHERE id = $5
    `

    rolesJSON, err := json.Marshal(user.Roles)
    if err != nil {
        return nil, fmt.Errorf("failed to marshal roles: %w", err)
    }

    _, err = s.db.ExecContext(ctx, query,
        user.Name, user.Email, rolesJSON, user.UpdatedAt, user.ID)
    if err != nil {
        return nil, fmt.Errorf("failed to update user: %w", err)
    }

    return user, nil
}

// GetAllUsers returns all users with pagination
func (s *UserService) GetAllUsers(ctx context.Context, limit, offset int) ([]*User, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()

    query := `
        SELECT id, name, email, roles, created_at, updated_at
        FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2
    `

    rows, err := s.db.QueryContext(ctx, query, limit, offset)
    if err != nil {
        return nil, fmt.Errorf("failed to query users: %w", err)
    }
    defer rows.Close()

    var users []*User
    for rows.Next() {
        var user User
        var rolesJSON []byte

        err := rows.Scan(
            &user.ID, &user.Name, &user.Email, &rolesJSON,
            &user.CreatedAt, &user.UpdatedAt)
        if err != nil {
            return nil, fmt.Errorf("failed to scan user: %w", err)
        }

        if err := json.Unmarshal(rolesJSON, &user.Roles); err != nil {
            return nil, fmt.Errorf("failed to unmarshal roles: %w", err)
        }

        users = append(users, &user)
    }

    if err := rows.Err(); err != nil {
        return nil, fmt.Errorf("error iterating users: %w", err)
    }

    return users, nil
}

// HTTP handlers
func (s *UserService) CreateUserHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Bad request", http.StatusBadRequest)
        return
    }

    user, err := s.Create(r.Context(), req)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}

func (s *UserService) GetUserHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    idStr := r.URL.Query().Get("id")
    id, err := uuid.Parse(idStr)
    if err != nil {
        http.Error(w, "Invalid ID", http.StatusBadRequest)
        return
    }

    user, err := s.FindByID(r.Context(), id)
    if err != nil {
        http.Error(w, err.Error(), http.StatusNotFound)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}

// Middleware for logging
func loggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        log.Printf("Started %s %s", r.Method, r.URL.Path)

        next(w, r)

        log.Printf("Completed %s %s in %v", r.Method, r.URL.Path, time.Since(start))
    }
}

// Main function with server setup
func main() {
    // Database connection
    db, err := sql.Open("postgres", "postgres://user:password@localhost/dbname?sslmode=disable")
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // Create service
    userService := NewUserService(db)

    // Set up routes
    http.HandleFunc("/users", loggingMiddleware(userService.CreateUserHandler))
    http.HandleFunc("/users/get", loggingMiddleware(userService.GetUserHandler))

    // Start server
    log.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}

// Error handling with custom types
type AppError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Status  int    `json:"-"`
}

func (e *AppError) Error() string {
    return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func NewAppError(code, message string, status int) *AppError {
    return &AppError{
        Code:    code,
        Message: message,
        Status:  status,
    }
}
```

## Markdown (Eager Language)

```markdown
# Advanced Markdown Features

## Headers and Structure
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header

## Text Formatting
This is **bold text**, *italic text*, and ***bold italic text***.
This is `inline code` and ~~strikethrough text~~.

## Lists

### Unordered Lists
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

### Ordered Lists
1. First item
2. Second item
   1. Nested ordered item
   2. Another nested item
3. Third item

### Task Lists
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task

## Links and Images

### Links
[Regular link](https://example.com)
[Link with title](https://example.com "Example website")
[Reference-style link][ref-link]

[ref-link]: https://example.com "Reference link"

### Images
![Alt text](https://example.com/image.png)
![Image with title](https://example.com/image.png "Image title")
![Reference-style image][ref-image]

[ref-image]: https://example.com/image.png "Reference image"

## Code Blocks

### Fenced Code Blocks
```javascript
function hello() {
  console.log("Hello, world!");
}
```

```python
def hello():
    print("Hello from Python")
```

### Indented Code Blocks
    This is an indented code block
    It preserves whitespace
    And can span multiple lines

## Tables

### Simple Table
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

### Aligned Table
| Left Align | Center Align | Right Align |
|:-----------|:------------:|------------:|
| Left       | Center       | Right       |
| Text       | Text         | Text        |

## Blockquotes

### Simple Blockquote
> This is a simple blockquote
> It can span multiple lines

### Nested Blockquotes
> First level blockquote
>> Nested blockquote
>>> Deeply nested blockquote

### Blockquote with Other Elements
> #### Header in Blockquote
> - List item in blockquote
> - Another list item
>
> ```javascript
> // Code in blockquote
> console.log("Hello!");
> ```

## Horizontal Rules
---

## HTML in Markdown
<p>This is <strong>HTML</strong> within Markdown</p>

<div class="highlight">
  <pre><code>This is HTML code block</code></pre>
</div>

## Footnotes
Here's a sentence with a footnote[^1].

[^1]: This is the footnote content.

## Definition Lists
Term 1
: Definition 1

Term 2
: Definition 2a
: Definition 2b

## Abbreviations
The HTML specification is maintained by the W3C.

*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

## Highlighting
==This text is highlighted==

## Subscript and Superscript
H~2~O (subscript)
X^2^ (superscript)

## Emojis
:smile: :heart: :thumbsup:

## Math (if supported)
$$E = mc^2$$

Inline math: $E = mc^2$
```

## JSON (Eager Language)

```json
{
  "userService": {
    "name": "User Management Service",
    "version": "1.0.0",
    "description": "A comprehensive user management system",
    "config": {
      "database": {
        "host": "localhost",
        "port": 5432,
        "name": "userdb",
        "credentials": {
          "username": "admin",
          "password": "${DB_PASSWORD}"
        },
        "pool": {
          "min": 2,
          "max": 10,
          "idle_timeout": 300
        }
      },
      "cache": {
        "enabled": true,
        "ttl": 3600,
        "max_memory": "512MB"
      },
      "features": [
        "user_creation",
        "user_update",
        "user_deletion",
        "role_management",
        "permission_checking"
      ]
    },
    "endpoints": [
      {
        "path": "/api/users",
        "method": "POST",
        "description": "Create a new user",
        "request": {
          "body": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string",
                "minLength": 2,
                "maxLength": 100
              },
              "email": {
                "type": "string",
                "format": "email"
              },
              "roles": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "default": ["user"]
              }
            },
            "required": ["name", "email"]
          }
        },
        "responses": {
          "201": {
            "description": "User created successfully",
            "schema": {
              "$ref": "#/definitions/User"
            }
          },
          "400": {
            "description": "Invalid request data",
            "schema": {
              "$ref": "#/definitions/Error"
            }
          }
        }
      },
      {
        "path": "/api/users/{id}",
        "method": "GET",
        "description": "Get user by ID",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "type": "string",
            "format": "uuid",
            "required": true
          }
        ],
        "responses": {
          "200": {
            "description": "User found",
            "schema": {
              "$ref": "#/definitions/User"
            }
          },
          "404": {
            "description": "User not found",
            "schema": {
              "$ref": "#/definitions/Error"
            }
          }
        }
      }
    ],
    "definitions": {
      "User": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string",
            "format": "email"
          },
          "roles": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "created_at": {
            "type": "string",
            "format": "date-time"
          },
          "updated_at": {
            "type": "string",
            "format": "date-time"
          }
        },
        "required": ["id", "name", "email", "created_at", "updated_at"]
      },
      "Error": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "details": {
            "type": "object"
          }
        },
        "required": ["code", "message"]
      }
    }
  }
}
```

## YAML (Eager Language)

```yaml
# Comprehensive YAML example with advanced features
user_service:
  name: "User Management Service"
  version: "1.0.0"
  description: "A comprehensive user management system with advanced features"

  # Configuration with nested structures
  config:
    database:
      host: "localhost"
      port: 5432
      name: "userdb"
      ssl: true
      credentials:
        username: "admin"
        password: "${DB_PASSWORD}"
      pool:
        min: 2
        max: 10
        idle_timeout: 300
        acquire_timeout: 60000

    cache:
      enabled: true
      ttl: 3600
      max_memory: "512MB"
      strategy: "LRU"

    security:
      jwt_secret: "${JWT_SECRET}"
      password_min_length: 8
      bcrypt_rounds: 12

    features:
      - user_creation
      - user_update
      - user_deletion
      - role_management
      - permission_checking
      - two_factor_auth
      - email_verification

  # Array of complex objects
  endpoints:
    - path: "/api/users"
      method: "POST"
      description: "Create a new user"
      authenticated: false
      rate_limit:
        requests: 10
        window: 60
      request:
        body:
          type: object
          properties:
            name:
              type: string
              minLength: 2
              maxLength: 100
            email:
              type: string
              format: email
            roles:
              type: array
              items:
                type: string
              default: ["user"]
          required: ["name", "email"]
      responses:
        "201":
          description: "User created successfully"
          schema:
            $ref: "#/definitions/User"
        "400":
          description: "Invalid request data"
          schema:
            $ref: "#/definitions/Error"

    - path: "/api/users/{id}"
      method: "GET"
      description: "Get user by ID"
      authenticated: true
      parameters:
        - name: "id"
          in: "path"
          type: "string"
          format: "uuid"
          required: true
      responses:
        "200":
          description: "User found"
          schema:
            $ref: "#/definitions/User"
        "404":
          description: "User not found"
          schema:
            $ref: "#/definitions/Error"

    - path: "/api/users/{id}"
      method: "PUT"
      description: "Update user"
      authenticated: true
      parameters:
        - name: "id"
          in: "path"
          type: "string"
          format: "uuid"
          required: true
      request:
        body:
          type: object
          properties:
            name:
              type: string
              minLength: 2
              maxLength: 100
            email:
              type: string
              format: email
            roles:
              type: array
              items:
                type: string
      responses:
        "200":
          description: "User updated"
          schema:
            $ref: "#/definitions/User"
        "404":
          description: "User not found"

  # Definitions with complex structures
  definitions:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
          format: email
        roles:
          type: array
          items:
            type: string
        profile:
          type: object
          properties:
            avatar_url:
              type: string
              format: uri
            bio:
              type: string
              maxLength: 500
            location:
              type: string
        preferences:
          type: object
          additionalProperties: true
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
      required: ["id", "name", "email", "created_at", "updated_at"]

    Error:
      type: object
      properties:
        code:
          type: string
          enum: ["VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED", "INTERNAL_ERROR"]
        message:
          type: string
        details:
          type: object
          additionalProperties: true
        timestamp:
          type: string
          format: date-time
      required: ["code", "message", "timestamp"]

  # Environment-specific configurations
  environments:
    development:
      debug: true
      log_level: "DEBUG"
      database:
        <<: *database_config
        name: "userdb_dev"

    staging:
      debug: false
      log_level: "INFO"
      database:
        <<: *database_config
        name: "userdb_staging"

    production:
      debug: false
      log_level: "WARN"
      database:
        <<: *database_config
        name: "userdb_prod"
      cache:
        enabled: true
        ttl: 7200
        max_memory: "2GB"

# Anchors and aliases
database_config: &database_config
  host: "${DB_HOST}"
  port: 5432
  ssl: true
  credentials:
    username: "${DB_USER}"
    password: "${DB_PASSWORD}"

# Multi-line strings
scripts:
  setup: |
    #!/bin/bash
    echo "Setting up user service..."
    npm install
    npm run build
    npm run migrate

  deploy: >
    This is a folded string that spans
    multiple lines but is treated as a
    single line when parsed.

# Complex data types
constants:
  max_users: 100000
  supported_languages: ["en", "es", "fr", "de", "ja"]
  feature_flags:
    new_ui: true
    beta_features: false
    maintenance_mode: false
  version_info:
    major: 1
    minor: 0
    patch: 0
    build: "2024-01-15"

# Null values and empty structures
optional_config:
  maybe_null: null
  empty_array: []
  empty_object: {}
  undefined_value: ~

# Comments and documentation
# This configuration file defines the complete setup for the user service
# including database connections, API endpoints, and environment-specific settings
```

## HTML (Eager Language)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Management Service</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdn.jsdelivr.net/npm/vue@3.2.45/dist/vue.global.js" defer></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }

        .user-card {
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1rem;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .user-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .btn:hover {
            transform: scale(1.05);
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #374151;
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>User Management Service</h1>
            <p>Comprehensive user management with modern web technologies</p>
        </header>

        <main id="app">
            <div class="user-list">
                <div v-for="user in users" :key="user.id" class="user-card">
                    <h3>{{ user.name }}</h3>
                    <p><strong>Email:</strong> {{ user.email }}</p>
                    <p><strong>Roles:</strong> {{ user.roles.join(', ') }}</p>
                    <p><strong>Created:</strong> {{ formatDate(user.created_at) }}</p>
                    <button @click="editUser(user)" class="btn">Edit</button>
                    <button @click="deleteUser(user.id)" class="btn" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); margin-left: 0.5rem;">Delete</button>
                </div>
            </div>

            <div v-if="showForm" class="user-form" style="padding: 2rem; border-top: 1px solid #e1e5e9;">
                <h2>{{ editingUser ? 'Edit User' : 'Add New User' }}</h2>
                <form @submit.prevent="saveUser">
                    <div class="form-group">
                        <label for="name">Name</label>
                        <input
                            id="name"
                            v-model="form.name"
                            type="text"
                            required
                            placeholder="Enter full name"
                        >
                    </div>

                    <div class="form-group">
                        <label for="email">Email</label>
                        <input
                            id="email"
                            v-model="form.email"
                            type="email"
                            required
                            placeholder="Enter email address"
                        >
                    </div>

                    <div class="form-group">
                        <label for="roles">Roles</label>
                        <select
                            id="roles"
                            v-model="form.roles"
                            multiple
                            style="height: 100px;"
                        >
                            <option value="admin">Administrator</option>
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="editor">Editor</option>
                        </select>
                    </div>

                    <button type="submit" class="btn" style="margin-right: 0.5rem;">{{ editingUser ? 'Update' : 'Create' }} User</button>
                    <button type="button" @click="cancelEdit" class="btn" style="background: #6b7280;">Cancel</button>
                </form>
            </div>

            <div style="padding: 2rem; text-align: center;">
                <button @click="showForm = !showForm" class="btn" style="font-size: 1.1rem; padding: 1rem 2rem;">
                    {{ showForm ? 'Hide' : 'Show' }} User Form
                </button>
            </div>
        </main>
    </div>

    <script>
        const { createApp } = Vue;

        createApp({
            data() {
                return {
                    users: [
                        {
                            id: 1,
                            name: 'John Doe',
                            email: 'john@example.com',
                            roles: ['admin', 'user'],
                            created_at: '2024-01-15T10:30:00Z'
                        },
                        {
                            id: 2,
                            name: 'Jane Smith',
                            email: 'jane@example.com',
                            roles: ['user'],
                            created_at: '2024-01-16T14:20:00Z'
                        }
                    ],
                    showForm: false,
                    editingUser: null,
                    form: {
                        name: '',
                        email: '',
                        roles: []
                    }
                }
            },

            methods: {
                formatDate(dateString) {
                    return new Date(dateString).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                },

                editUser(user) {
                    this.editingUser = user;
                    this.form = {
                        name: user.name,
                        email: user.email,
                        roles: [...user.roles]
                    };
                    this.showForm = true;
                },

                async saveUser() {
                    if (this.editingUser) {
                        // Update existing user
                        Object.assign(this.editingUser, this.form);
                        this.editingUser.created_at = new Date().toISOString();
                    } else {
                        // Create new user
                        const newUser = {
                            id: Date.now(),
                            ...this.form,
                            created_at: new Date().toISOString()
                        };
                        this.users.push(newUser);
                    }

                    this.cancelEdit();
                    await this.persistUsers();
                },

                deleteUser(userId) {
                    if (confirm('Are you sure you want to delete this user?')) {
                        this.users = this.users.filter(u => u.id !== userId);
                        this.persistUsers();
                    }
                },

                cancelEdit() {
                    this.editingUser = null;
                    this.form = { name: '', email: '', roles: [] };
                    this.showForm = false;
                },

                async persistUsers() {
                    try {
                        localStorage.setItem('users', JSON.stringify(this.users));
                    } catch (error) {
                        console.error('Failed to persist users:', error);
                    }
                },

                loadUsers() {
                    try {
                        const stored = localStorage.getItem('users');
                        if (stored) {
                            this.users = JSON.parse(stored);
                        }
                    } catch (error) {
                        console.error('Failed to load users:', error);
                    }
                }
            },

            mounted() {
                this.loadUsers();
            }
        }).mount('#app');
    </script>
</body>
</html>
```

## CSS (Eager Language)

```css
/* Comprehensive CSS example with advanced features */

/* CSS Custom Properties (Variables) */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #1ec4f2;
  --text-color: #374151;
  --background-color: #f8fafc;
  --border-color: #e1e5e9;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --border-radius: 8px;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Dark theme variant */
[data-theme="dark"] {
  --primary-color: #4f46e5;
  --secondary-color: #7c3aed;
  --text-color: #f9fafb;
  --background-color: #111827;
  --border-color: #374151;
}

/* Base styles */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: var(--spacing-lg);
  font-family: var(--font-family);
  color: var(--text-color);
  background-color: var(--background-color);
  line-height: 1.6;
}

/* Container and layout */
.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

[data-theme="dark"] .container {
  background: var(--background-color);
  border: 1px solid var(--border-color);
}

/* Header styles */
.header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  padding: var(--spacing-xl);
  text-align: center;
  position: relative;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
}

.header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  position: relative;
  z-index: 1;
}

.header p {
  margin: var(--spacing-md) 0 0 0;
  font-size: 1.1rem;
  opacity: 0.9;
  position: relative;
  z-index: 1;
}

/* User card component */
.user-card {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin: var(--spacing-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.user-card:hover::before {
  transform: scaleX(1);
}

[data-theme="dark"] .user-card {
  border-color: var(--border-color);
  background: rgba(255, 255, 255, 0.05);
}

.user-card h3 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--primary-color);
  font-size: 1.25rem;
  font-weight: 600;
}

.user-card p {
  margin: var(--spacing-xs) 0;
  color: var(--text-color);
  opacity: 0.8;
}

.user-card strong {
  color: var(--text-color);
  font-weight: 600;
}

/* Button styles */
.btn {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: calc(var(--border-radius) - 2px);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn:active {
  transform: translateY(0);
}

.btn-danger {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
}

.btn-danger:hover {
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
}

/* Form styles */
.user-form {
  padding: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

[data-theme="dark"] .user-form {
  background: rgba(255, 255, 255, 0.02);
  border-color: var(--border-color);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
  color: var(--text-color);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  color: var(--text-color);
}

[data-theme="dark"] .form-group input,
[data-theme="dark"] .form-group select {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--border-color);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group select {
  height: 120px;
  resize: vertical;
}

/* Responsive design */
@media (max-width: 768px) {
  .container {
    margin: var(--spacing-md);
    border-radius: calc(var(--border-radius) - 2px);
  }

  .header {
    padding: var(--spacing-lg);
  }

  .header h1 {
    font-size: 2rem;
  }

  .user-card {
    margin: var(--spacing-sm);
    padding: var(--spacing-md);
  }

  .user-form {
    padding: var(--spacing-lg);
  }
}

@media (max-width: 480px) {
  body {
    padding: var(--spacing-sm);
  }

  .header {
    padding: var(--spacing-md);
  }

  .header h1 {
    font-size: 1.75rem;
  }

  .btn {
    width: 100%;
    margin-bottom: var(--spacing-sm);
  }
}

/* Animation keyframes */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.user-card {
  animation: fadeInUp 0.6s ease-out;
}

.btn {
  animation: pulse 2s infinite;
}

/* Utility classes */
.text-center {
  text-align: center;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.d-flex {
  display: flex;
}

.justify-center {
  justify-content: center;
}

.align-center {
  align-items: center;
}

.space-between {
  justify-content: space-between;
}

.mt-1 { margin-top: var(--spacing-xs); }
.mt-2 { margin-top: var(--spacing-sm); }
.mt-3 { margin-top: var(--spacing-md); }
.mt-4 { margin-top: var(--spacing-lg); }
.mt-5 { margin-top: var(--spacing-xl); }

/* Print styles */
@media print {
  .btn,
  .user-form {
    display: none;
  }

  .user-card {
    break-inside: avoid;
    border: 1px solid #000;
    margin: 0;
    box-shadow: none;
  }

  body {
    background: white;
    color: black;
  }
}
```

## Ruby (Lazy Language)

```ruby
# Comprehensive Ruby example with advanced features
require 'sinatra'
require 'sequel'
require 'json'
require 'bcrypt'
require 'jwt'
require 'redis'
require 'sidekiq'
require 'active_support'
require 'active_support/core_ext'

# Database configuration
DB = Sequel.connect(ENV.fetch('DATABASE_URL', 'postgres://localhost/user_service'))

# Redis configuration
REDIS = Redis.new(url: ENV.fetch('REDIS_URL', 'redis://localhost:6379'))

# JWT configuration
JWT_SECRET = ENV.fetch('JWT_SECRET', 'your-secret-key')

# User model with ActiveRecord-like functionality
class User < Sequel::Model
  plugin :timestamps
  plugin :validation_helpers
  plugin :json_serializer

  one_to_many :user_sessions
  many_to_many :roles

  def validate
    super
    validates_presence [:name, :email]
    validates_unique :email
    validates_format /\A[^@\s]+@[^@\s]+\z/, :email
    validates_length_range 2..100, :name
  end

  def password=(new_password)
    return if new_password.blank?
    self.password_digest = BCrypt::Password.create(new_password)
  end

  def authenticate(password)
    return false if password_digest.blank?
    BCrypt::Password.new(password_digest) == password
  end

  def generate_token
    payload = {
      user_id: id,
      exp: 24.hours.from_now.to_i,
      iat: Time.now.to_i
    }
    JWT.encode(payload, JWT_SECRET, 'HS256')
  end

  def self.from_token(token)
    begin
      payload = JWT.decode(token, JWT_SECRET, true, algorithm: 'HS256').first
      find(id: payload['user_id'])
    rescue JWT::DecodeError
      nil
    end
  end
end

# Role model
class Role < Sequel::Model
  plugin :timestamps
  many_to_many :users

  def validate
    super
    validates_presence :name
    validates_unique :name
  end
end

# User session model for tracking active sessions
class UserSession < Sequel::Model
  plugin :timestamps
  many_to_one :user

  def self.cleanup_expired
    where { created_at < 30.days.ago }.delete
  end
end

# User service with comprehensive business logic
class UserService
  include ActiveSupport::Callbacks

  define_callbacks :create_user, :update_user, :delete_user

  def initialize(cache: REDIS)
    @cache = cache
  end

  def create_user(params)
    run_callbacks :create_user do
      DB.transaction do
        user = User.new(params.slice(:name, :email, :password))
        user.save

        # Assign default role
        default_role = Role.find_or_create(name: 'user')
        user.add_role(default_role)

        # Cache user data
        cache_user(user)

        user
      end
    end
  rescue Sequel::ValidationFailed => e
    raise UserError.new(:validation_failed, e.message)
  end

  def find_user(id)
    @cache.get("user:#{id}")&.then { |json| User.from_json(json) } ||
    User[id]&.tap { |user| cache_user(user) }
  end

  def update_user(id, params)
    run_callbacks :update_user do
      user = User[id] or raise UserError.new(:not_found, "User not found")

      DB.transaction do
        user.update(params.slice(:name, :email, :password))
        invalidate_user_cache(user.id)
        cache_user(user)
      end

      user
    end
  end

  def delete_user(id)
    run_callbacks :delete_user do
      user = User[id] or raise UserError.new(:not_found, "User not found")

      DB.transaction do
        user.destroy
        invalidate_user_cache(id)
      end
    end
  end

  def authenticate_user(email, password)
    user = User.first(email: email)
    return nil unless user&.authenticate(password)

    # Create session
    session = UserSession.create(user: user)
    { user: user, session: session, token: user.generate_token }
  end

  def get_users(page: 1, per_page: 20)
    dataset = User.dataset
      .order(:created_at.desc)
      .paginate(page, per_page)

    {
      users: dataset.all,
      pagination: {
        page: page,
        per_page: per_page,
        total: User.count,
        total_pages: (User.count.to_f / per_page).ceil
      }
    }
  end

  private

  def cache_user(user)
    @cache.setex("user:#{user.id}", 3600, user.to_json)
  end

  def invalidate_user_cache(user_id)
    @cache.del("user:#{user_id}")
  end
end

# Custom error class
class UserError < StandardError
  attr_reader :code, :details

  def initialize(code, message, details = {})
    @code = code
    @details = details
    super(message)
  end
end

# Sinatra application
class UserAPI < Sinatra::Base
  helpers do
    def authenticate!
      token = request.env['HTTP_AUTHORIZATION']&.split(' ')&.last
      @current_user = User.from_token(token)
      halt 401, { error: 'Unauthorized' }.to_json unless @current_user
    end

    def json_params
      JSON.parse(request.body.read).symbolize_keys
    rescue JSON::ParserError
      halt 400, { error: 'Invalid JSON' }.to_json
    end
  end

  before do
    content_type :json
  end

  post '/users' do
    begin
      user = UserService.new.create_user(json_params)
      status 201
      user.to_json
    rescue UserError => e
      status case e.code
             when :validation_failed then 422
             when :not_found then 404
             else 500
             end
      { error: e.message, code: e.code }.to_json
    end
  end

  get '/users/:id' do
    authenticate!
    user = UserService.new.find_user(params[:id].to_i)
    halt 404, { error: 'User not found' }.to_json unless user
    user.to_json
  end

  put '/users/:id' do
    authenticate!
    user = UserService.new.update_user(params[:id].to_i, json_params)
    user.to_json
  end

  delete '/users/:id' do
    authenticate!
    UserService.new.delete_user(params[:id].to_i)
    status 204
  end

  post '/auth/login' do
    result = UserService.new.authenticate_user(
      json_params[:email],
      json_params[:password]
    )

    if result
      status 200
      {
        user: result[:user],
        token: result[:token],
        session_id: result[:session][:id]
      }.to_json
    else
      status 401
      { error: 'Invalid credentials' }.to_json
    end
  end

  get '/users' do
    authenticate!
    page = params[:page]&.to_i || 1
    per_page = [params[:per_page]&.to_i || 20, 100].min

    result = UserService.new.get_users(page: page, per_page: per_page)
    result.to_json
  end
end

# Background job for cleanup
class CleanupJob
  include Sidekiq::Worker

  def perform
    UserSession.cleanup_expired
    UserService.new.send(:invalidate_user_cache, '*') # Clear all cache
  end
end

# Configuration and startup
if __FILE__ == $0
  # Create tables if they don't exist
  DB.create_table? :users do
    primary_key :id
    String :name, null: false
    String :email, null: false, unique: true
    String :password_digest
    DateTime :created_at, null: false
    DateTime :updated_at, null: false
  end

  DB.create_table? :roles do
    primary_key :id
    String :name, null: false, unique: true
    DateTime :created_at, null: false
    DateTime :updated_at, null: false
  end

  DB.create_table? :user_sessions do
    primary_key :id
    foreign_key :user_id, :users, null: false
    DateTime :created_at, null: false
    DateTime :updated_at, null: false
  end

  DB.create_table? :users_roles do
    foreign_key :user_id, :users, null: false
    foreign_key :role_id, :roles, null: false
    primary_key [:user_id, :role_id]
  end

  # Start the server
  UserAPI.run!
end
```

## C (Lazy Language)

```c
/* Comprehensive C example with advanced features */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <pthread.h>
#include <sqlite3.h>
#include <openssl/sha.h>
#include <curl/curl.h>
#include <jansson.h>

/* Configuration constants */
#define MAX_NAME_LENGTH 100
#define MAX_EMAIL_LENGTH 255
#define MAX_PASSWORD_LENGTH 128
#define MAX_ROLES 10
#define MAX_ROLE_LENGTH 50
#define DATABASE_PATH "users.db"
#define SERVER_PORT 8080
#define THREAD_POOL_SIZE 4

/* User structure */
typedef struct {
    int id;
    char name[MAX_NAME_LENGTH];
    char email[MAX_EMAIL_LENGTH];
    char password_hash[65]; // SHA-256 hex string
    char roles[MAX_ROLES][MAX_ROLE_LENGTH];
    int role_count;
    time_t created_at;
    time_t updated_at;
} User;

/* Database connection pool */
typedef struct {
    sqlite3 *db;
    pthread_mutex_t mutex;
} DBConnection;

/* Thread pool for handling requests */
typedef struct {
    pthread_t threads[THREAD_POOL_SIZE];
    int task_queue[THREAD_POOL_SIZE * 2];
    int queue_size;
    pthread_mutex_t queue_mutex;
    pthread_cond_t queue_cond;
} ThreadPool;

/* Error codes */
typedef enum {
    USER_SUCCESS = 0,
    USER_ERROR_NOT_FOUND = 1,
    USER_ERROR_VALIDATION = 2,
    USER_ERROR_DATABASE = 3,
    USER_ERROR_MEMORY = 4,
    USER_ERROR_NETWORK = 5
} UserError;

/* Function prototypes */
UserError user_create(const char *name, const char *email, const char *password, User **result);
UserError user_find_by_id(int id, User **result);
UserError user_update(int id, const char *name, const char *email, User **result);
UserError user_delete(int id);
UserError user_authenticate(const char *email, const char *password, User **result);

/* Utility functions */
char* sha256_hash(const char *str) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256_CTX sha256;
    SHA256_Init(&sha256);
    SHA256_Update(&sha256, str, strlen(str));
    SHA256_Final(hash, &sha256);

    char *hex_hash = malloc(65);
    if (!hex_hash) return NULL;

    for (int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        sprintf(hex_hash + (i * 2), "%02x", hash[i]);
    }
    hex_hash[64] = '\0';
    return hex_hash;
}

int validate_email(const char *email) {
    // Simple email validation
    return strchr(email, '@') != NULL && strchr(email, '.') != NULL;
}

int validate_password(const char *password) {
    return strlen(password) >= 8;
}

/* Database operations */
UserError init_database(DBConnection *conn) {
    char *err_msg = NULL;
    const char *sql = "CREATE TABLE IF NOT EXISTS users ("
                      "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                      "name TEXT NOT NULL,"
                      "email TEXT UNIQUE NOT NULL,"
                      "password_hash TEXT NOT NULL,"
                      "roles TEXT NOT NULL,"
                      "created_at INTEGER NOT NULL,"
                      "updated_at INTEGER NOT NULL"
                      ");";

    pthread_mutex_lock(&conn->mutex);
    int rc = sqlite3_exec(conn->db, sql, NULL, NULL, &err_msg);
    pthread_mutex_unlock(&conn->mutex);

    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL error: %s\n", err_msg);
        sqlite3_free(err_msg);
        return USER_ERROR_DATABASE;
    }

    return USER_SUCCESS;
}

UserError user_create(const char *name, const char *email, const char *password, User **result) {
    // Validation
    if (strlen(name) == 0 || strlen(name) > MAX_NAME_LENGTH - 1) {
        return USER_ERROR_VALIDATION;
    }
    if (!validate_email(email)) {
        return USER_ERROR_VALIDATION;
    }
    if (!validate_password(password)) {
        return USER_ERROR_VALIDATION;
    }

    // Hash password
    char *hash = sha256_hash(password);
    if (!hash) {
        return USER_ERROR_MEMORY;
    }

    // Prepare SQL
    const char *sql = "INSERT INTO users (name, email, password_hash, roles, created_at, updated_at) "
                      "VALUES (?, ?, ?, ?, ?, ?);";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db_conn.db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        free(hash);
        return USER_ERROR_DATABASE;
    }

    // Bind parameters
    sqlite3_bind_text(stmt, 1, name, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, email, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, hash, -1, SQLITE_TRANSIENT);

    // Default role as JSON
    json_t *roles = json_array();
    json_array_append_new(roles, json_string("user"));
    char *roles_json = json_dumps(roles, 0);
    sqlite3_bind_text(stmt, 4, roles_json, -1, SQLITE_TRANSIENT);

    time_t now = time(NULL);
    sqlite3_bind_int64(stmt, 5, now);
    sqlite3_bind_int64(stmt, 6, now);

    // Execute
    rc = sqlite3_step(stmt);
    if (rc != SQLITE_DONE) {
        sqlite3_finalize(stmt);
        free(hash);
        free(roles_json);
        json_decref(roles);
        return USER_ERROR_DATABASE;
    }

    // Get inserted ID
    int user_id = sqlite3_last_insert_rowid(db_conn.db);
    sqlite3_finalize(stmt);
    free(hash);
    free(roles_json);
    json_decref(roles);

    // Return created user
    return user_find_by_id(user_id, result);
}

UserError user_find_by_id(int id, User **result) {
    const char *sql = "SELECT id, name, email, password_hash, roles, created_at, updated_at "
                      "FROM users WHERE id = ?;";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db_conn.db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        return USER_ERROR_DATABASE;
    }

    sqlite3_bind_int(stmt, 1, id);
    rc = sqlite3_step(stmt);

    if (rc != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        return USER_ERROR_NOT_FOUND;
    }

    // Allocate result
    *result = malloc(sizeof(User));
    if (!*result) {
        sqlite3_finalize(stmt);
        return USER_ERROR_MEMORY;
    }

    // Populate user struct
    (*result)->id = sqlite3_column_int(stmt, 0);
    strncpy((*result)->name, (const char*)sqlite3_column_text(stmt, 1), MAX_NAME_LENGTH - 1);
    strncpy((*result)->email, (const char*)sqlite3_column_text(stmt, 2), MAX_EMAIL_LENGTH - 1);
    strncpy((*result)->password_hash, (const char*)sqlite3_column_text(stmt, 3), 65);

    // Parse roles JSON
    const char *roles_json = (const char*)sqlite3_column_text(stmt, 4);
    json_t *roles = json_loads(roles_json, 0, NULL);
    if (roles && json_is_array(roles)) {
        (*result)->role_count = json_array_size(roles);
        for (int i = 0; i < (*result)->role_count && i < MAX_ROLES; i++) {
            json_t *role = json_array_get(roles, i);
            if (json_is_string(role)) {
                strncpy((*result)->roles[i], json_string_value(role), MAX_ROLE_LENGTH - 1);
            }
        }
        json_decref(roles);
    } else {
        (*result)->role_count = 0;
    }

    (*result)->created_at = sqlite3_column_int64(stmt, 5);
    (*result)->updated_at = sqlite3_column_int64(stmt, 6);

    sqlite3_finalize(stmt);
    return USER_SUCCESS;
}

UserError user_authenticate(const char *email, const char *password, User **result) {
    // Hash password for comparison
    char *hash = sha256_hash(password);
    if (!hash) {
        return USER_ERROR_MEMORY;
    }

    const char *sql = "SELECT id FROM users WHERE email = ? AND password_hash = ?;";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db_conn.db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        free(hash);
        return USER_ERROR_DATABASE;
    }

    sqlite3_bind_text(stmt, 1, email, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, hash, -1, SQLITE_TRANSIENT);

    rc = sqlite3_step(stmt);
    if (rc != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        free(hash);
        return USER_ERROR_NOT_FOUND;
    }

    int user_id = sqlite3_column_int(stmt, 0);
    sqlite3_finalize(stmt);
    free(hash);

    return user_find_by_id(user_id, result);
}

/* HTTP Server using libcurl for simplicity (in practice would use a proper HTTP server) */
void handle_request(const char *method, const char *path, const char *body) {
    if (strcmp(method, "POST") == 0 && strcmp(path, "/users") == 0) {
        // Parse JSON body
        json_t *request = json_loads(body, 0, NULL);
        if (!request) {
            printf("HTTP/1.1 400 Bad Request\r\n\r\n");
            return;
        }

        json_t *name = json_object_get(request, "name");
        json_t *email = json_object_get(request, "email");
        json_t *password = json_object_get(request, "password");

        if (!json_is_string(name) || !json_is_string(email) || !json_is_string(password)) {
            json_decref(request);
            printf("HTTP/1.1 400 Bad Request\r\n\r\n");
            return;
        }

        User *user;
        UserError err = user_create(
            json_string_value(name),
            json_string_value(email),
            json_string_value(password),
            &user
        );

        json_decref(request);

        if (err != USER_SUCCESS) {
            printf("HTTP/1.1 400 Bad Request\r\n\r\n");
            return;
        }

        // Return JSON response
        json_t *response = json_object();
        json_object_set_new(response, "id", json_integer(user->id));
        json_object_set_new(response, "name", json_string(user->name));
        json_object_set_new(response, "email", json_string(user->email));
        json_object_set_new(response, "created_at", json_integer(user->created_at));

        char *response_str = json_dumps(response, JSON_INDENT(2));
        printf("HTTP/1.1 201 Created\r\nContent-Type: application/json\r\n\r\n%s", response_str);

        free(response_str);
        json_decref(response);
        free(user);
    } else {
        printf("HTTP/1.1 404 Not Found\r\n\r\n");
    }
}

/* Main function */
int main(int argc, char *argv[]) {
    // Initialize database
    if (sqlite3_open(DATABASE_PATH, &db_conn.db) != SQLITE_OK) {
        fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db_conn.db));
        return 1;
    }

    pthread_mutex_init(&db_conn.mutex, NULL);

    UserError db_err = init_database(&db_conn);
    if (db_err != USER_SUCCESS) {
        fprintf(stderr, "Failed to initialize database\n");
        return 1;
    }

    // Simple HTTP server loop (in practice, use a proper server library)
    printf("User service starting on port %d...\n", SERVER_PORT);

    // For demonstration, just show that we can create and find users
    User *user;
    UserError err = user_create("John Doe", "john@example.com", "password123", &user);
    if (err == USER_SUCCESS) {
        printf("Created user: %s (%s)\n", user->name, user->email);
        free(user);
    }

    // Cleanup
    sqlite3_close(db_conn.db);
    pthread_mutex_destroy(&db_conn.mutex);

    return 0;
}
```

This is getting very long. I need to continue with the other languages but keep it reasonable. Let me create a shorter version for the remaining languages and then create the benchmark test file.

Let me continue with C++ and then create the benchmark file. The fixture is getting too long. Let me create a separate comprehensive fixture file and then move to benchmarks. 

Actually, let me create the comprehensive fixture file with all 18 languages but make each example more concise to fit within reasonable length. Then create the benchmark test. 

Let me continue with the remaining languages in a more compact format. 

## C++ (Lazy Language)

```cpp
#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <optional>
#include <chrono>
#include <thread>
#include <mutex>
#include <sqlite3.h>
#include <nlohmann/json.hpp>
#include <openssl/sha.h>

using json = nlohmann::json;

class User {
private:
    int id_;
    std::string name_;
    std::string email_;
    std::string password_hash_;
    std::vector<std::string> roles_;
    std::chrono::system_clock::time_point created_at_;
    std::chrono::system_clock::time_point updated_at_;

public:
    User(int id, std::string name, std::string email,
         std::string password_hash, std::vector<std::string> roles)
        : id_(id), name_(std::move(name)), email_(std::move(email)),
          password_hash_(std::move(password_hash)), roles_(std::move(roles)),
          created_at_(std::chrono::system_clock::now()),
          updated_at_(std::chrono::system_clock::now()) {}

    // Getters
    int getId() const { return id_; }
    const std::string& getName() const { return name_; }
    const std::string& getEmail() const { return email_; }
    const std::vector<std::string>& getRoles() const { return roles_; }

    // JSON serialization
    json toJson() const {
        return {
            {"id", id_},
            {"name", name_},
            {"email", email_},
            {"roles", roles_},
            {"created_at", std::chrono::duration_cast<std::chrono::seconds>(
                created_at_.time_since_epoch()).count()},
            {"updated_at", std::chrono::duration_cast<std::chrono::seconds>(
                updated_at_.time_since_epoch()).count()}
        };
    }
};

class UserService {
private:
    sqlite3* db_;
    std::mutex db_mutex_;

    std::string hashPassword(const std::string& password) {
        unsigned char hash[SHA256_DIGEST_LENGTH];
        SHA256_CTX sha256;
        SHA256_Init(&sha256);
        SHA256_Update(&sha256, password.c_str(), password.size());
        SHA256_Final(hash, &sha256);

        std::stringstream ss;
        for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) {
            ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
        }
        return ss.str();
    }

public:
    UserService(const std::string& db_path) {
        if (sqlite3_open(db_path.c_str(), &db_) != SQLITE_OK) {
            throw std::runtime_error("Failed to open database");
        }
        initDatabase();
    }

    ~UserService() {
        if (db_) sqlite3_close(db_);
    }

    std::shared_ptr<User> createUser(const std::string& name,
                                    const std::string& email,
                                    const std::string& password,
                                    const std::vector<std::string>& roles = {"user"}) {
        std::lock_guard<std::mutex> lock(db_mutex_);

        std::string hash = hashPassword(password);

        std::string sql = R"(
            INSERT INTO users (name, email, password_hash, roles, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        )";

        sqlite3_stmt* stmt;
        if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            throw std::runtime_error("Failed to prepare statement");
        }

        json roles_json = roles;
        auto now = std::chrono::system_clock::now();
        auto timestamp = std::chrono::duration_cast<std::chrono::seconds>(
            now.time_since_epoch()).count();

        sqlite3_bind_text(stmt, 1, name.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, email.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, hash.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, roles_json.dump().c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int64(stmt, 5, timestamp);
        sqlite3_bind_int64(stmt, 6, timestamp);

        if (sqlite3_step(stmt) != SQLITE_DONE) {
            sqlite3_finalize(stmt);
            throw std::runtime_error("Failed to create user");
        }

        int user_id = sqlite3_last_insert_rowid(db_);
        sqlite3_finalize(stmt);

        return std::make_shared<User>(user_id, name, email, hash, roles);
    }

    std::optional<std::shared_ptr<User>> findById(int id) {
        std::lock_guard<std::mutex> lock(db_mutex_);

        std::string sql = "SELECT id, name, email, password_hash, roles FROM users WHERE id = ?";

        sqlite3_stmt* stmt;
        if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            return std::nullopt;
        }

        sqlite3_bind_int(stmt, 1, id);

        if (sqlite3_step(stmt) != SQLITE_ROW) {
            sqlite3_finalize(stmt);
            return std::nullopt;
        }

        int user_id = sqlite3_column_int(stmt, 0);
        std::string name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        std::string email = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
        std::string hash = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));

        std::string roles_str = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
        auto roles = json::parse(roles_str).get<std::vector<std::string>>();

        sqlite3_finalize(stmt);

        return std::make_shared<User>(user_id, name, email, hash, roles);
    }

private:
    void initDatabase() {
        const char* sql = R"(
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                roles TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
        )";

        char* err_msg;
        if (sqlite3_exec(db_, sql, nullptr, nullptr, &err_msg) != SQLITE_OK) {
            std::string error = err_msg;
            sqlite3_free(err_msg);
            throw std::runtime_error("Failed to create table: " + error);
        }
    }
};

int main() {
    try {
        UserService service("users.db");

        // Create a user
        auto user = service.createUser("John Doe", "john@example.com", "password123");
        std::cout << "Created user: " << user->getName() << " (" << user->getEmail() << ")" << std::endl;

        // Find the user
        auto found = service.findById(user->getId());
        if (found) {
            std::cout << "Found user: " << (*found)->getName() << std::endl;
            std::cout << "JSON: " << (*found)->toJson().dump(2) << std::endl;
        }

    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}
```

I'll continue with the remaining languages in a more concise format to complete the comprehensive fixture. The key is to provide representative examples of each language's syntax and features while keeping the overall file size manageable.

For the remaining languages, I'll provide shorter but still comprehensive examples:

## Java (Lazy Language)

```java
import java.sql.*;
import java.util.*;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;

public class UserService {
    private final String dbUrl = "jdbc:postgresql://localhost:5432/users";

    public record User(int id, String name, String email, List<String> roles,
                      Instant createdAt, Instant updatedAt) {}

    public CompletableFuture<User> createUser(String name, String email, String password) {
        return CompletableFuture.supplyAsync(() -> {
            try (Connection conn = DriverManager.getConnection(dbUrl)) {
                String hash = hashPassword(password);
                List<String> roles = List.of("user");

                String sql = """
                    INSERT INTO users (name, email, password_hash, roles, created_at, updated_at)
                    VALUES (?, ?, ?, ?::jsonb, ?, ?)
                    RETURNING id
                    """;

                try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, name);
                    stmt.setString(2, email);
                    stmt.setString(3, hash);
                    stmt.setString(4, new com.fasterxml.jackson.databind.ObjectMapper()
                        .writeValueAsString(roles));
                    Instant now = Instant.now();
                    stmt.setTimestamp(5, Timestamp.from(now));
                    stmt.setTimestamp(6, Timestamp.from(now));

                    ResultSet rs = stmt.executeQuery();
                    if (rs.next()) {
                        return new User(rs.getInt("id"), name, email, roles, now, now);
                    }
                    throw new RuntimeException("Failed to create user");
                }
            } catch (Exception e) {
                throw new RuntimeException("Database error", e);
            }
        });
    }

    private String hashPassword(String password) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(password.getBytes());
        return Base64.getEncoder().encodeToString(hash);
    }
}
```

## Shell/Bash (Lazy Language)

```bash
#!/bin/bash

# User service management script
set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_NAME="${DB_NAME:-user_service}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/users}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Database functions
db_connect() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t
}

create_user() {
    local name="$1"
    local email="$2"
    local password="$3"

    # Validate input
    if [[ -z "$name" || -z "$email" || -z "$password" ]]; then
        log_error "Name, email, and password are required"
        return 1
    fi

    # Hash password
    local password_hash
    password_hash=$(echo -n "$password" | sha256sum | cut -d' ' -f1)

    # Insert user
    local sql="
    INSERT INTO users (name, email, password_hash, roles, created_at, updated_at)
    VALUES ('$name', '$email', '$password_hash', '[\"user\"]', NOW(), NOW())
    RETURNING id;"

    local user_id
    user_id=$(echo "$sql" | db_connect)

    if [[ -n "$user_id" ]]; then
        log_info "Created user $name with ID $user_id"
        echo "$user_id"
    else
        log_error "Failed to create user"
        return 1
    fi
}

backup_database() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/users_$timestamp.sql"

    mkdir -p "$BACKUP_DIR"

    log_info "Creating database backup: $backup_file"
    PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" > "$backup_file"

    # Compress backup
    gzip "$backup_file"
    log_info "Backup completed and compressed"
}

cleanup_old_backups() {
    local days="${1:-30}"

    log_info "Cleaning up backups older than $days days"
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$days" -delete
    log_info "Cleanup completed"
}

# Main script logic
main() {
    case "${1:-}" in
        create-user)
            if [[ $# -lt 4 ]]; then
                log_error "Usage: $0 create-user <name> <email> <password>"
                exit 1
            fi
            create_user "$2" "$3" "$4"
            ;;
        backup)
            backup_database
            ;;
        cleanup)
            cleanup_old_backups "${2:-30}"
            ;;
        *)
            log_error "Usage: $0 {create-user|backup|cleanup} [args...]"
            log_info "Examples:"
            log_info "  $0 create-user 'John Doe' john@example.com password123"
            log_info "  $0 backup"
            log_info "  $0 cleanup 7"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
```

## TOML (Lazy Language)

```toml
# Bumblebee Configuration File
title = "Bumblebee Markdown Viewer"
version = "1.0.0"
description = "A terminal-first Markdown viewer with Neovim-style editing"

[database]
host = "localhost"
port = 5432
name = "bumblebee"
user = "bumblebee_user"
password = "${DB_PASSWORD}"
ssl = true
connection_timeout = 30
pool_size = 10

[cache]
enabled = true
ttl = 3600
max_memory = "512MB"
strategy = "LRU"

[features]
code_blocks = true
syntax_highlighting = true
table_rendering = true
image_placeholders = true
auto_save = true
vim_keybindings = true

[theme]
name = "bumblebee"
primary_color = "#F2D638"
secondary_color = "#E9B033"
accent_color = "#1EC4F2"
background = "#010600"

[keybindings]
normal_mode = "escape"
insert_mode = "i"
render_mode = "r"
quit = "q"
toggle_explorer = "space+e"

[logging]
level = "info"
file = "/var/log/bumblebee.log"
max_size = "100MB"
max_files = 5

[security]
jwt_secret = "${JWT_SECRET}"
bcrypt_rounds = 12
session_timeout = 3600
max_login_attempts = 5

[performance]
render_cache_size = 200
language_cache_size = 500
debounce_delay = 300
virtual_scrolling = true

[[plugins]]
name = "vim-integration"
enabled = true
config = { editor = "nvim", suspend_tui = true }

[[plugins]]
name = "git-integration"
enabled = true
config = { show_status = true, auto_commit = false }

[dependencies]
markdown_parser = "remark-parse"
syntax_highlighter = "shiki"
terminal_ui = "neo-blessed"
database_orm = "prisma"
cache = "redis"
```

## SQL (Lazy Language)

```sql
-- User Management System Schema and Operations

-- Create database and connect
CREATE DATABASE IF NOT EXISTS user_service;
USE user_service;

-- Users table with comprehensive structure
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash CHAR(64) NOT NULL COMMENT 'SHA-256 hash',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles table for role-based access control
CREATE TABLE roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User roles junction table
CREATE TABLE user_roles (
    user_id BIGINT UNSIGNED NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT UNSIGNED,

    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions for tracking active sessions
CREATE TABLE user_sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id BIGINT UNSIGNED NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log for tracking user actions
CREATE TABLE audit_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    INDEX idx_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'Full system access'),
('user', 'Standard user access'),
('moderator', 'Content moderation access');

-- Create user procedure with validation
DELIMITER //

CREATE PROCEDURE create_user(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_password VARCHAR(255),
    OUT p_user_id BIGINT UNSIGNED
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Validate input
    IF LENGTH(TRIM(p_name)) = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Name cannot be empty';
    END IF;

    IF NOT (p_email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid email format';
    END IF;

    IF LENGTH(p_password) < 8 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Password must be at least 8 characters';
    END IF;

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already exists';
    END IF;

    -- Create user
    INSERT INTO users (name, email, password_hash)
    VALUES (TRIM(p_name), LOWER(TRIM(p_email)), SHA2(p_password, 256));

    SET p_user_id = LAST_INSERT_ID();

    -- Assign default role
    INSERT INTO user_roles (user_id, role_id)
    SELECT p_user_id, id FROM roles WHERE name = 'user';

    -- Log audit event
    INSERT INTO audit_log (action, resource_type, resource_id, new_values)
    VALUES ('user_created', 'user', p_user_id, JSON_OBJECT('name', p_name, 'email', p_email));

    COMMIT;
END //

DELIMITER ;

-- Function to authenticate user
DELIMITER //

CREATE FUNCTION authenticate_user(p_email VARCHAR(255), p_password VARCHAR(255))
RETURNS BIGINT UNSIGNED
DETERMINISTIC
BEGIN
    DECLARE user_id BIGINT UNSIGNED DEFAULT NULL;

    SELECT id INTO user_id
    FROM users
    WHERE email = LOWER(TRIM(p_email))
    AND password_hash = SHA2(p_password, 256)
    AND email_verified = TRUE;

    RETURN user_id;
END //

DELIMITER ;

-- View for user details with roles
CREATE VIEW user_details AS
SELECT
    u.id,
    u.name,
    u.email,
    u.email_verified,
    u.created_at,
    u.updated_at,
    GROUP_CONCAT(r.name SEPARATOR ', ') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.name, u.email, u.email_verified, u.created_at, u.updated_at;

-- Clean up expired sessions (call periodically)
DELETE FROM user_sessions WHERE expires_at < NOW();

-- Performance indexes for common queries
CREATE INDEX idx_users_email_verified ON users(email, email_verified);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Example usage
-- CALL create_user('John Doe', 'john@example.com', 'securepassword123', @user_id);
-- SELECT authenticate_user('john@example.com', 'securepassword123');
-- SELECT * FROM user_details WHERE id = @user_id;
```

This comprehensive fixture covers all 18 languages supported by Bumblebee's Shiki integration. Each example demonstrates the language's key features and syntax highlighting capabilities. The fixture is used for testing code block rendering across different programming languages. 

Now I need to create the benchmark test file. 

Let me create the benchmark test file. 

<xai:function_call name="create_file">
<parameter name="path">/home/ridgetop/aidis/projects/bumblebee/tests/codeblocks-benchmark.test.ts
