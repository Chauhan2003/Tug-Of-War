# AI-Powered Question Generation

This document explains how the AI question generation system works using Groq AI to create intelligent, contextual math questions for the Tug of War game.

## 🤖 How It Works

### 1. AI Question Generation Process

When a user selects a class and level, the system:

1. **Analyzes the Context**: Retrieves class information (operations, difficulty) and level details (number range, question count)
2. **Builds AI Prompt**: Creates a detailed prompt specific to the educational level
3. **Calls Groq API**: Sends the prompt to Groq's Llama3 model
4. **Validates Response**: Checks mathematical accuracy and format
5. **Caches Results**: Stores questions for future use
6. **Returns Questions**: Sends all questions with answers to frontend

### 2. Question Structure

Each AI-generated question includes:

```json
{
  "id": 1,
  "question": "What is 15 + 8?",
  "num1": 15,
  "num2": 8,
  "operation": "+",
  "answer": 23,
  "explanation": "To solve 15 + 8, we add 15 and 8 to get 23.",
  "difficulty": "easy",
  "category": "addition"
}
```

### 3. Response Format

```json
{
  "status": "success",
  "data": {
    "questions": [...],
    "metadata": {
      "totalQuestions": 10,
      "operations": ["+", "-"],
      "difficulty": "beginner",
      "estimatedTime": 60
    }
  },
  "metadata": {
    "generated": "2024-01-15T10:30:00.000Z",
    "userId": "user123",
    "aiGenerated": true
  }
}
```

## 🚀 API Endpoints

### Generate AI Questions
```http
POST /api/game/questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "classId": 1,
  "levelId": "level_id_here"
}
```

### Check AI Service Status
```http
GET /api/game/ai-status
Authorization: Bearer <token>
```

### Clear Question Cache
```http
DELETE /api/game/cache/:classId/:levelId
Authorization: Bearer <token>
```

### Legacy Single Question (for compatibility)
```http
POST /api/game/question
Authorization: Bearer <token>
Content-Type: application/json

{
  "classId": 1,
  "levelId": "level_id_here"
}
```

## ⚙️ Configuration

### Environment Variables

```bash
# Groq AI Configuration
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama3-8b-8192
AI_CACHE_ENABLED=true
AI_CACHE_TTL=3600
```

### Available Models

- `llama3-8b-8192` - Fast, efficient for simple questions
- `llama3-70b-8192` - More capable for complex problems
- `mixtral-8x7b-32768` - Good for creative explanations

## 🎯 Frontend Integration

### 1. Fetch Questions

```javascript
// Fetch all questions for a level
const response = await fetch('/api/game/questions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    classId: selectedClass,
    levelId: selectedLevel
  })
});

const { data } = await response.json();
const questions = data.questions;
```

### 2. Display Questions

```javascript
// Show questions one by one with answers available
let currentQuestionIndex = 0;

function showQuestion() {
  const question = questions[currentQuestionIndex];
  
  // Display question text
  document.getElementById('question').textContent = question.question;
  
  // Store answer for validation
  currentAnswer = question.answer;
  
  // Optional: Show explanation after answer
  setTimeout(() => {
    document.getElementById('explanation').textContent = question.explanation;
  }, 1000);
}

function submitAnswer(userAnswer) {
  const isCorrect = userAnswer === currentAnswer;
  
  if (isCorrect) {
    // Move to next question
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      showQuestion();
    } else {
      // Game completed
      endGame();
    }
  } else {
    // Show correct answer and explanation
    showCorrectAnswer();
  }
}
```

### 3. Game Flow

1. **Start Game**: Fetch all questions at once
2. **Display Progress**: Show current question number (e.g., "Question 3 of 10")
3. **Validate Answers**: Check against AI-generated answers
4. **Show Explanations**: Display AI explanations for learning
5. **Track Performance**: Record score and accuracy
6. **Submit Results**: Send final score to backend

## 🔄 Fallback System

If AI generation fails, the system automatically falls back to traditional question generation:

- **Random number generation** based on level parameters
- **Basic explanations** for each operation
- **Same response format** for frontend compatibility
- **Logged warnings** for monitoring

## 📊 Performance & Caching

### Caching Strategy

- **Cache Key**: `ai:questions:{classId}:{levelId}`
- **TTL**: 1 hour (configurable)
- **Cache Hit**: Returns instantly without AI call
- **Cache Miss**: Generates new questions and caches them

### Performance Monitoring

- **Response Time Tracking**: Log AI generation duration
- **Success Rate**: Monitor AI vs fallback usage
- **Error Logging**: Detailed error information
- **Cache Hit Rate**: Track caching effectiveness

## 🔧 Troubleshooting

### Common Issues

**AI API Key Missing**
```bash
Error: GROQ_API_KEY not configured
Solution: Set GROQ_API_KEY in environment variables
```

**AI Rate Limits**
```bash
Error: Too many requests to Groq API
Solution: Implement caching or upgrade API plan
```

**Invalid AI Response**
```bash
Error: AI response format invalid
Solution: System falls back to traditional generation
```

### Debug Mode

Enable debug logging to see AI interactions:

```bash
LOG_LEVEL=debug npm run dev
```

### Cache Management

Clear cache for specific levels:

```bash
# Clear cache for class 1, level abc123
curl -X DELETE /api/game/cache/1/abc123 \
  -H "Authorization: Bearer <token>"
```

## 🎓 Educational Benefits

### AI-Generated Questions Provide:

1. **Contextual Difficulty**: Questions match the class and level appropriately
2. **Varied Problem Types**: Different approaches to the same operations
3. **Educational Explanations**: Clear, age-appropriate explanations
4. **Progressive Learning**: Questions build on previous concepts
5. **Engagement**: More interesting than purely random questions

### Example Questions by Level:

**Beginner (Class 1, Level 1)**:
- "What is 5 + 3?"
- "If you have 7 apples and get 2 more, how many do you have?"

**Intermediate (Class 3, Level 3)**:
- "A baker has 4 boxes with 6 donuts each. How many donuts total?"
- "What is the product of 8 and 7?"

**Advanced (Class 5, Level 5)**:
- "A store sells items in packs of 12. If you need 60 items, how many packs?"
- "What is 144 ÷ 12?"

## 🔮 Future Enhancements

### Planned Features:

1. **Adaptive Difficulty**: AI adjusts based on user performance
2. **Multi-step Problems**: Complex questions with multiple operations
3. **Word Problems**: Story-based mathematical scenarios
4. **Visual Explanations**: AI generates visual aids
5. **Personalized Learning**: AI tracks user progress and adapts
6. **Voice Explanations**: Audio versions of AI explanations

### Integration Ideas:

- **Learning Analytics**: Track which question types users struggle with
- **Hint System**: AI provides progressive hints
- **Mistake Analysis**: AI explains common errors
- **Study Recommendations**: AI suggests practice areas

## 📝 Implementation Notes

### AI Prompt Engineering

The prompt is carefully designed to:

- **Specify exact format** for consistent parsing
- **Include educational context** for age-appropriate content
- **Require integer answers** for simple validation
- **Request explanations** for learning value
- **Set difficulty parameters** based on level data

### Error Handling

- **Graceful Degradation**: Always provides questions, AI or fallback
- **Detailed Logging**: All AI interactions logged for monitoring
- **User Transparency**: Frontend can show if questions were AI-generated
- **Retry Logic**: Automatic retry with exponential backoff

### Security Considerations

- **API Key Protection**: Never expose API keys to frontend
- **Input Sanitization**: All inputs validated before AI calls
- **Response Validation**: AI answers mathematically verified
- **Rate Limiting**: Prevent abuse of AI endpoints

This AI integration transforms the math game from simple random problems to an intelligent, adaptive learning system that can scale to thousands of users with personalized educational content.
