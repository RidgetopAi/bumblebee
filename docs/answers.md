1. Starting from Phase 0 nothing in /bumblebee except for /docs
2. They have instructions in @iteration-prompt-amp-free.md to use aidis and save their plan and then handoff context...they also have instructions to git commit and push
3. From their prompt:
   "**Prove your work is correct:**

4. **Run tests**: All must pass, no exceptions
5. **TypeScript check**: Zero errors required
6. **Build**: Must succeed cleanly
7. **Manual testing**: Use the feature, verify it works
8. **Git verification**: Check actual changes match claims
9. **Document proof**: Store test output, screenshots, logs

**Store verification results:**

```typescript
context_store(
  content: "Verification results with proof",
  type: "completion",
  tags: ["verified", "instance_N"]
)
```

---

## Proof of Work Requirements

### Git Commits as Evidence

- Commit messages must be accurate (verify with `git diff --stat`)
- Push to remote (verify with `git status`)
- Claims about changes must match `git show`

### Test Evidence

- Copy actual test output (pass/fail counts)
- Store in completion context
- Never claim "tests pass" without running them

### Build Evidence

- Actual build output (time, size, errors)
- TypeScript compilation results
- Verifiable metrics

### What You Cannot Claim:

- ❌ "Tests pass" without output
- ❌ "Zero errors" without verification
- ❌ "Deployed successfully" without checking
- ❌ "Verified working" without testing

---

## AIDIS Integration

**Required contexts to store:**

1. **Planning** - Your implementation strategy
2. **Completion** - What you built with verification proof
3. **Lessons** - What you learned (if applicable)
4. **Handoff** - Critical info for next instance

**Discovery tools ranked by value:**

1. `smart_search()` - Best for finding patterns across contexts
2. `context_search()` - Find specific topics (handoffs, lessons)
3. `context_get_recent()` - Recent instance work

---

## Red Flags (Do NOT Do This)

❌ Rush because you "don't have time"
❌ Skip exploration to "get started faster"
❌ Modify tests to make them pass
❌ Claim verification without proof
❌ Use mock data as permanent solution
❌ Make breaking changes without documenting
❌ Ignore architecture impact on future instances
❌ Cut corners on "hard" parts

---

## Success Criteria

### You succeeded if:

✅ All tests pass (verified with output)
✅ TypeScript compiles with 0 errors
✅ Build succeeds cleanly
✅ Feature works (manually tested)
✅ Git commits accurate (verified)
✅ Proof of work stored in AIDIS
✅ Handoff context for next instance
✅ Code is cleaner than you found it
✅ You can honestly answer questions about your work

### You failed if:

❌ Tests fail or were modified to pass
❌ Claimed verification without testing
❌ No proof of work
❌ Broke existing functionality
❌ Cut corners due to imaginary time pressure

---

## End of Session Protocol

**Before claiming completion:**

1. Run full test suite one final time
2. Verify TypeScript compilation
3. Check git status (committed? pushed?)
4. Store completion context with proof
5. Create handoff for next instance

**Be ready to answer:**

- What did you build? (specifics)
- How did you verify it works? (proof)
- What tests did you run? (output)
- What could break from your changes? (awareness)
- What should next instance know? (handoff)"

check they did what they said, use git and history to verify they ran tests we will spot check their tests and run them when I think we should. I want the code verified no typscript errors though....i hate tech debt...that's to much for solo builder to carry. you most certainly can reject and that is part of your role...we are building a real app here that I will use for dev work. Reject policy: you identify the problem areas that need to be fixed and we send that summary back to agent. we also use this again to extrat lessons and save these pitfalls and issues we encounter to try and make llm's work smarter through a project as it grows...think what would be important to know if i was working on this and I needed to come in and start working right away.

4. bumblebee project is set up...make sure you switch to that project on entry every time. Yes let's generate tasks for phase 1....I may assing multiple tasks to one agent. but try and break them down into workable one shot tasks.
5. You verify they left a handoff, and you will then after your review leave a small summary of their work quality...more data driven, think report card but based on real metrics you can easily verify....let's just define them for me. your good at this. If there are valuable lessons to be learned then we extract those and save those as 'lessons'
6. you are reactive...i will say something like 'instance [n] is ready for review'

an underlying goal here is use of aidis (it works and is our memory) and dialing in a workflow that works for larger projects....this is small compared to where i am heading. So if we start seeing patterns of problems we pause and think what can we do to make this easier, better, stop this...those things.
