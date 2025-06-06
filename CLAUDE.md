# Logic Gate Puzzle Game Requirements

## Overview
A web-based escape room game where participants solve logic gate puzzles to collectively decode a final string message. Each participant contributes specific bits to form the complete answer.

## Technical Stack
- **Frontend**: Next.js with React
- **Database**: Prisma ORM with SQLite
- **Updates**: HTTP polling (3-second intervals)
- **Configuration**: Final strings stored in .env file

## Environment Configuration
```env
FINAL_STRINGS=ESCAPE,UNLOCK,SECRET,VICTORY,SOLVED,PUZZLE,CIPHER,DECODE
```

## Game Flow

### Phase 1: Room Setup (Admin)
1. **Admin Input**: Team number, Student amount
2. **System Process**:
   - Generate roomCode UUID
   - Randomly select answerString from .env
   - Create GameRoom record
   - Navigate to `/game/[roomCode]`
   - Generate QR code pointing to `/join/[roomCode]`

### Phase 2: Student Registration
1. Students scan QR → `/join/[roomCode]`
2. Enter displayName
3. System creates Student record
4. Auto-assign bit positions (3-4 bits per student)
5. Generate unique puzzle based on student ID

### Phase 3: Game Execution
1. Admin clicks "Start Game" → status = "active"
2. Students see puzzle activation
3. Admin dashboard polls every 3 seconds
4. Students solve and submit solutions

### Phase 4: Completion
1. All students complete → status = "completed"
2. Combine all solvedBits → reveal answerString
3. Display victory screen

## API Endpoints

### Admin
- `POST /api/rooms` → Create room, return roomCode
- `GET /api/rooms/[roomCode]` → Room status + student progress
- `POST /api/rooms/[roomCode]/start` → Set status to "active"

### Student  
- `GET /api/rooms/[roomCode]/join` → Room info for joining
- `POST /api/students` → Create student in room
- `GET /api/students/[studentId]` → Student puzzle data
- `POST /api/students/[studentId]/submit` → Submit solution

## Pages

### `/game/[roomCode]` (Admin Dashboard)
- Room info display
- QR code for students
- Student list with completion status
- Bit assembly visualization
- Start/Reset buttons
- Final string reveal

### `/join/[roomCode]` (Student Interface)
- Room joining form
- Logic gate puzzle display
- Step-by-step solution input
- Progress indicator

## Anti-Guessing Mechanism
- **3-4 bits per student** (12.5% - 6.25% guess rate)
- **Multi-step validation** required
- **Unique puzzle inputs** per student
- **Process verification** for all steps

## Success Criteria
- Individual: All assignedBits correctly solved
- Collective: Complete answerString assembled
- Real-time progress tracking via polling