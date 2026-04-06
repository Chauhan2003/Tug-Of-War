# Frontend AI Integration Guide

This guide explains how to integrate the new AI-powered question generation system into the frontend.

## 🚀 What's New

### AI-Powered Features
- **Intelligent Questions**: AI generates contextual math problems based on class and level
- **Educational Explanations**: Each question includes clear explanations for learning
- **Caching System**: Questions are cached for better performance
- **Fallback System**: Traditional question generation if AI fails

### New Components
- `AIGameScreen.tsx` - Enhanced game screen with AI questions
- `useAIQuestions.ts` - Hook for AI question management
- Updated `ModeSelection.tsx` - Added AI Practice mode

## 🔧 Setup Instructions

### 1. Add AI Game Route

Update your routing configuration to include the new AI game screen:

```tsx
// In your main App.tsx or router configuration
import AIGameScreen from './components/AIGameScreen';

// Add this route
<Route path="/ai-game" element={<AIGameScreen />} />
```

### 2. Update Navigation Flow

The navigation flow for AI questions is:
1. **Class Selection** → Choose math class
2. **Level Selection** → Select difficulty level  
3. **Mode Selection** → Choose "AI Practice"
4. **AI Game Screen** → Play with AI-generated questions

### 3. Environment Variables

Add these to your `.env` file:

```bash
# API Configuration
VITE_API_URL=http://localhost:3001/api
```

## 🎮 How It Works

### AI Question Generation Flow

1. **User Selection**: User selects class and level
2. **API Call**: Frontend calls `/api/game/questions` with classId and levelId
3. **AI Processing**: Backend generates 10 questions using Groq AI
4. **Response**: Questions with answers and explanations returned
5. **Game Play**: Questions displayed one-by-one with explanations shown after answers

### Question Structure

Each AI-generated question includes:

```typescript
interface Question {
  id: number;
  question: string;        // "What is 15 + 8?"
  num1: number;            // 15
  num2: number;            // 8
  operation: string;       // "+"
  answer: number;          // 23
  explanation: string;      // "To solve 15 + 8, we add 15 and 8 to get 23."
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'addition' | 'subtraction' | 'multiplication' | 'division';
}
```

## 🎨 UI Features

### Enhanced Game Screen

The `AIGameScreen` component includes:

- **Loading States**: Shows AI generation progress
- **Error Handling**: Graceful fallback if AI fails
- **AI Indicator**: Shows when questions are AI-generated
- **Explanations**: Displays educational explanations after answers
- **Question Metadata**: Shows difficulty and category
- **Enhanced Feedback**: Better visual feedback for correct/wrong answers

### Visual Indicators

- **🤖 AI Badge**: Indicates AI-generated questions
- **Difficulty Colors**: Green (easy), Yellow (medium), Red (hard)
- **Category Icons**: ➕➖✖️➗ for operation types
- **Explanation Boxes**: Blue boxes with educational content

## 🔌 API Integration

### New API Functions

```typescript
// Generate AI questions
const questions = await apiGetAIQuestions(classId, levelId);

// Check AI service status
const status = await apiGetAIStatus();

// Clear question cache
await apiClearAICache(classId, levelId);
```

### Hook Usage

```typescript
const { 
  questions, 
  loading, 
  error, 
  isAIGenerated, 
  fetchQuestions 
} = useAIQuestions({
  classId: 1,
  levelId: 'level_id_here',
  enabled: true
});
```

## 🔄 Error Handling

### Fallback Behavior

If AI generation fails:
1. **Automatic Fallback**: Uses traditional random questions
2. **User Notification**: Shows "using fallback generation" message
3. **Same Interface**: Maintains consistent game experience
4. **Logging**: Errors logged for monitoring

### Error States

- **Loading**: Shows spinner with "Generating AI Questions..."
- **Error**: Displays error message with retry button
- **No Questions**: Shows preparation message

## 🎯 Best Practices

### Performance

- **Caching**: Questions cached for 1 hour to reduce API calls
- **Lazy Loading**: Questions fetched only when needed
- **Error Boundaries**: Prevent crashes from AI failures

### User Experience

- **Loading Feedback**: Clear indication of AI generation
- **Educational Value**: Explanations help learning
- **Consistent Interface**: Same game mechanics as before
- **Graceful Degradation**: Always provides questions, AI or fallback

### Testing

```typescript
// Test AI integration
const testAIQuestions = async () => {
  const questions = await apiGetAIQuestions(1, 'test_level');
  console.log('Generated questions:', questions);
  console.log('AI generated:', questions.metadata.aiGenerated);
};
```

## 🚨 Troubleshooting

### Common Issues

**API Connection Error**
```bash
# Check backend is running
npm run dev  # in server directory
```

**CORS Issues**
```bash
# Check CORS configuration
# Backend should allow frontend origin
```

**AI Service Unavailable**
```bash
# Check Groq API key
echo $GROQ_API_KEY
```

**TypeScript Errors**
```bash
# Install missing types
npm install --save-dev @types/node
```

### Debug Mode

Enable debug logging:
```typescript
// In browser console
localStorage.setItem('debug', 'true');
```

## 📱 Mobile Considerations

The AI game screen is fully responsive:
- **Touch-friendly**: Large buttons for mobile
- **Readable Text**: Scaled appropriately
- **Performance**: Optimized for mobile devices
- **Orientation**: Works in portrait and landscape

## 🔮 Future Enhancements

### Planned Features

1. **Adaptive Difficulty**: AI adjusts based on performance
2. **Voice Explanations**: Audio versions of explanations
3. **Visual Aids**: AI-generated diagrams and charts
4. **Multi-language**: Support for different languages
5. **Progress Tracking**: AI analyzes learning patterns

### Integration Ideas

- **Study Mode**: Dedicated practice with AI explanations
- **Hint System**: Progressive hints from AI
- **Review Mode**: Review mistakes with AI explanations
- **Challenge Mode**: AI creates personalized challenges

## 🎉 Benefits

### For Students

- **Personalized Learning**: Questions match their level
- **Better Understanding**: Explanations help comprehension
- **Engagement**: More interesting than random problems
- **Confidence**: Builds skills with appropriate difficulty

### For Teachers

- **Consistent Quality**: AI ensures question quality
- **Time Saving**: No need to create questions manually
- **Adaptive Learning**: AI can adjust to student needs
- **Analytics**: Track student progress with AI insights

### For Developers

- **Scalable**: Handles many users efficiently
- **Maintainable**: Clean separation of concerns
- **Extensible**: Easy to add new AI features
- **Reliable**: Fallback system ensures availability

This AI integration transforms the math game from simple random problems to an intelligent, adaptive learning system that provides personalized educational content with explanations! 🎓✨
