# Testing Guide for Fixed Chess Trainer

## How to Test the Fixes

### 1. Open the Application
```bash
# Simply open index.html in your browser
open index.html
# Or double-click index.html
```

---

### 2. Enable Debug Mode (Optional but Recommended)

**Step 1:** Open the browser's Developer Console
- **Chrome/Edge:** Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Firefox:** Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
- **Safari:** Press `Cmd+Option+C` (Mac)

**Step 2:** In the console, type:
```javascript
gameState.debugMode = true;
```

**Step 3:** Press Enter

Now you'll see verification logs showing:
- ✅ "Total interactions (should be 1): 1" - This confirms the fix is working!
- Details about which pieces interact
- Active and target piece information

---

### 3. Test Single Piece Interaction

**What to verify:**
1. Register a user (enter a name and click "Register")
2. Click "Start Game"
3. Watch the position appear and disappear
4. Watch one piece move

**In Debug Mode, check the console:**
- You should see: `Total interactions (should be 1): 1`
- If you see any other number, something is wrong

**Visual Test:**
- In "Beginner Mode" (click the button), all pieces stay visible
- You should see exactly ONE piece that can be attacked by the active piece
- No other pieces should be attacking each other

---

### 4. Test Valid Chess Positions

**What to verify:**

**Kings:**
- If you see two kings, they should NEVER be next to each other
- There should be at least one empty square between them

**Bishops:**
- If you see two bishops of the same color (both white or both black), they should be on different colored squares
- One bishop on light square, one on dark square

**Pawns:**
- Pawns should NEVER appear on the top row (row 0) or bottom row (row 7)
- All pawns should be in the middle of the board

**Visual Check:**
Play several games and watch the positions. They should all look "legal" and possible in a real chess game.

---

### 5. Test Game Flow

**Complete Test Sequence:**

1. **Register:** Enter your name → Click "Register"
   - ✅ Should show "Welcome, [your name]!"

2. **Start Game:** Click "Start Game"
   - ✅ Timer should start
   - ✅ Should show "Level: 1"
   - ✅ Should show "Move: 0/20"

3. **Watch Animation:**
   - ✅ All pieces appear briefly
   - ✅ Pieces disappear (in Blindfold mode)
   - ✅ One piece appears and moves
   - ✅ Board becomes empty

4. **Make a Guess:** Click on a square
   - ✅ If correct: "Correct!" message, move counter increases
   - ✅ If wrong: "Wrong!" message, error counter increases
   - ✅ After 3 errors: Game Over
   - ✅ After 20 correct guesses: Level Complete!

5. **Check Leaderboard:**
   - ✅ Your score should appear in the leaderboard
   - ✅ Higher scores should be at the top

---

### 6. Test Both Game Modes

**Blindfold Mode (Default):**
- ✅ Pieces appear briefly, then disappear
- ✅ You have to remember where they are
- ✅ Board is empty when you guess

**Beginner Mode:**
- ✅ Click "For Beginners" button
- ✅ All pieces stay visible during the game
- ✅ You can see which piece was attacked

---

### 7. Test Hint System

1. Start a game
2. Click "Hint" button
3. ✅ Target square should highlight briefly
4. Try to use hint again
5. ✅ Should show "You already used hint on this level!"

---

### 8. Common Issues and Solutions

**Problem:** Game doesn't start
- **Solution:** Make sure you registered first (entered your name)

**Problem:** Console shows "Total interactions: 0" or "> 1"
- **Solution:** This shouldn't happen with the fixes. If it does, refresh the page and try again.

**Problem:** Pieces appear on invalid squares
- **Solution:** This shouldn't happen anymore. If it does, check that you're using the updated `script.js` file.

**Problem:** Animation doesn't show piece moving
- **Solution:** The piece appears in one place, disappears, then appears in another place. This is normal.

---

### 9. Debug Console Commands

Useful commands to test in the browser console:

```javascript
// Enable debug mode
gameState.debugMode = true;

// Check current game state
console.log(gameState);

// Check current pieces
console.log(gameState.pieces);

// Check active piece
console.log('Active:', gameState.activePiece);

// Check target piece  
console.log('Target:', gameState.targetPiece);

// Manually verify position
verifyPositionCorrectness();
```

---

### 10. Expected Behavior Summary

✅ **Single Piece Interaction:**
- Active piece should attack EXACTLY ONE enemy piece
- No other pieces should attack each other
- Console should show "Total interactions: 1"

✅ **Valid Positions:**
- Kings never adjacent
- Same-color bishops on different colored squares
- Pawns only on rows 1-6
- All positions look legal

✅ **Game Flow:**
- 20 moves to complete a level
- 3 errors maximum
- Timer counts up
- Scores are saved
- Levels increase difficulty (more pieces)

---

## Quick Visual Test Checklist

- [ ] Registered a user
- [ ] Started a game successfully
- [ ] Saw pieces appear and disappear (Blindfold mode)
- [ ] Saw one piece move
- [ ] Made correct guesses
- [ ] Made wrong guesses
- [ ] Used a hint successfully
- [ ] Completed a level OR got game over
- [ ] Saw my score in leaderboard
- [ ] Tried "Beginner Mode" - pieces stayed visible
- [ ] (Debug mode) Saw "Total interactions: 1" in console

---

## If Everything Works...

🎉 **Congratulations!** Your chess trainer now meets the hackathon requirements!

The fixes ensure:
- ✅ Exactly one piece interaction per position
- ✅ All chess positions are legal and valid
- ✅ Smooth animations with proper move tracking
- ✅ Complete game flow from start to finish

You're ready for the hackathon presentation! 🏆

