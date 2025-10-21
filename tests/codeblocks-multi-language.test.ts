import { describe, it, expect } from 'vitest';
import { render } from '../src/render/mdastToAnsi.js';
import { bumblebeeTheme } from '../src/config/theme-bumblebee.js';

describe('Code Blocks Multi-Language Testing', () => {
  const testLanguages = [
    'python', 'ruby', 'rust', 'go', 'javascript', 'typescript',
    'java', 'c', 'cpp', 'bash', 'sql', 'json', 'yaml'
  ];

  describe('TB053-5a: Test various languages (py, rb, rs, go, etc.)', () => {
    it.each(testLanguages)(
      'should render %s code blocks without crashing',
      async (lang) => {
        const sampleCode = getSampleCode(lang);
        const markdown = `\`\`\`${lang}\n${sampleCode}\n\`\`\``;
        const output = await render(markdown, 120, bumblebeeTheme);

        // Basic validation - should render successfully
        expect(output).toBeDefined();
        expect(output.length).toBeGreaterThan(0);
        expect(typeof output).toBe('string');

        // Should have proper structure
        expect(output).toContain('─'); // Top/bottom borders
        expect(output).toContain('│'); // Side borders
        expect(output).toContain(lang); // Language badge

        // Should have syntax highlighting (ANSI escape codes)
        expect(output).toMatch(/\x1b\[/);
      }
    );

    it('should handle language aliases', async () => {
      const sampleCode = `def hello():\n    print("Hello")`;
      const markdown = `\`\`\`py\n${sampleCode}\n\`\`\``;
      const output = await render(markdown, 120, bumblebeeTheme);

      expect(output).toBeDefined();
      expect(output).toContain('py'); // Should show alias
      expect(output).toMatch(/\x1b\[/); // Should have highlighting
    });

    it('should handle unknown languages gracefully', async () => {
      const sampleCode = `custom syntax @#$%^&*()`;
      const markdown = `\`\`\`unknownlang\n${sampleCode}\n\`\`\``;
      const output = await render(markdown, 120, bumblebeeTheme);

      expect(output).toBeDefined();
      expect(output).toContain('unknownlang'); // Badge with unknown language
      expect(output).toContain('─'); // Still has borders
    });

    it('should maintain performance across languages', async () => {
      const sampleCode = `function test() { return 42; }`;
      const markdown = `\`\`\`javascript\n${sampleCode}\n\`\`\``;

      const results = [];
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        await render(markdown, 120, bumblebeeTheme);
        const endTime = performance.now();
        results.push(endTime - startTime);
      }

      const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
      expect(avgTime).toBeLessThan(100); // Should render quickly
    });
  });
});

// Helper function to get sample code for each language
function getSampleCode(lang: string): string {
  const samples: Record<string, string> = {
    python: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)`,
    ruby: `class UserService
  def initialize
    @users = {}
  end

  def create_user(name, email)
    @users[name] = email
  end
end`,
    rust: `struct User {
    name: String,
    email: String,
}

impl User {
    fn new(name: &str, email: &str) -> Self {
        User {
            name: name.to_string(),
            email: email.to_string(),
        }
    }
}`,
    go: `type User struct {
    Name  string
    Email string
}

func (u *User) Display() {
    fmt.Printf("User: %s <%s>\\n", u.Name, u.Email)
}`,
    javascript: `const app = express();

app.get('/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`,
    typescript: `interface User {
  readonly id: number;
  name: string;
  email: string;
}

class UserService {
  async create(userData: Omit<User, 'id'>): Promise<User> {
    const user = { id: Date.now(), ...userData };
    return user;
  }
}`,
    java: `public class UserService {
    private List<User> users = new ArrayList<>();

    public void addUser(String name, String email) {
        users.add(new User(name, email));
    }
}`,
    c: `#include <stdio.h>

typedef struct {
    char name[50];
    char email[100];
} User;

User* create_user(const char* name, const char* email) {
    User* user = malloc(sizeof(User));
    strcpy(user->name, name);
    return user;
}`,
    cpp: `#include <iostream>
#include <string>

class User {
private:
    std::string name;
    std::string email;

public:
    User(const std::string& name, const std::string& email)
        : name(name), email(email) {}
};`,
    bash: `#!/bin/bash

create_user() {
    local name="$1"
    local email="$2"
    echo "$name:$email" >> users.txt
}

find_user() {
    grep "^$1:" users.txt
}`,
    sql: `CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE
);

INSERT INTO users (name, email) VALUES
('Alice', 'alice@example.com');

SELECT * FROM users WHERE name = 'Alice';`,
    json: `{
  "users": [
    {
      "name": "Alice",
      "email": "alice@example.com",
      "active": true
    }
  ]
}`,
    yaml: `users:
  - name: "Alice"
    email: "alice@example.com"
    active: true`
  };

  return samples[lang] || `console.log("Sample code for ${lang}");`;
}
