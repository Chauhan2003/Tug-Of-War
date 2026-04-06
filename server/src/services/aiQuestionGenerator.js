const Groq = require('groq-sdk');
const logger = require('../utils/logger');
const { cache } = require('../utils/cache');
const { ValidationError } = require('../utils/errorHandler');

class AIQuestionGenerator {
  constructor() {
    this.groq = process.env.GROQ_API_KEY ? new Groq({
      apiKey: process.env.GROQ_API_KEY,
      dangerouslyAllowBrowser: false
    }) : null;
    
    this.model = process.env.GROQ_MODEL || 'llama3-8b-8192';
    this.cacheEnabled = process.env.AI_CACHE_ENABLED !== 'false';
    this.cacheTTL = parseInt(process.env.AI_CACHE_TTL) || 3600; // 1 hour
  }

  // Generate questions based on class and level
  async generateQuestions(classId, levelId, userId = null) {
    // Check if Groq is available
    if (!this.groq) {
      logger.warn('Groq API not configured, using fallback questions', { classId, levelId, userId });
      return this.generateFallbackQuestions(classId, levelId);
    }

    try {
      // Check cache first
      const cacheKey = `ai:questions:${classId}:${levelId}`;
      if (this.cacheEnabled) {
        const cached = await cache.get(cacheKey);
        if (cached) {
          logger.debug('AI questions cache hit', { classId, levelId, userId });
          return cached;
        }
      }

      // Get class and level information
      const classInfo = await this.getClassInfo(classId);
      const levelInfo = await this.getLevelInfo(levelId);
      
      if (!classInfo || !levelInfo) {
        throw new ValidationError('Invalid class or level');
      }

      // Generate AI prompt
      const prompt = this.buildPrompt(classInfo, levelInfo);
      
      // Call Groq API
      const startTime = Date.now();
      const response = await this.groq.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert math teacher creating educational questions for students. Generate age-appropriate math problems that are challenging but solvable. Always provide accurate answers and clear explanations.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });

      const responseTime = Date.now() - startTime;
      logger.info('AI question generation completed', {
        classId,
        levelId,
        userId,
        responseTime,
        model: this.model
      });

      // Parse and validate response
      const questions = this.parseAIResponse(response.choices[0].message.content);
      
      // Validate questions
      this.validateQuestions(questions, classInfo, levelInfo);
      
      // Cache the results
      if (this.cacheEnabled) {
        await cache.set(cacheKey, questions, this.cacheTTL);
      }

      return questions;
    } catch (error) {
      logger.error('AI question generation failed', error, {
        classId,
        levelId,
        userId
      });
      
      // Fallback to traditional question generation
      return this.generateFallbackQuestions(classId, levelId);
    }
  }

  // Build AI prompt based on class and level
  buildPrompt(classInfo, levelInfo) {
    const operations = classInfo.operations || '+-*/';
    const difficulty = this.getDifficultyDescription(levelInfo);
    const questionCount = levelInfo.questions_count || 10;
    const maxNum = levelInfo.max_number || 20;
    
    // Adjust prompt based on difficulty
    let difficultyInstructions = '';
    if (difficulty === 'expert') {
      difficultyInstructions = `
- Include multi-step problems and word problems
- Use larger numbers and more complex operations
- Include problems that require mental math strategies
- Challenge students with estimation and problem-solving skills`;
    } else if (difficulty === 'advanced') {
      difficultyInstructions = `
- Include some multi-step problems
- Use moderate to large numbers
- Mix of straightforward and slightly complex problems`;
    } else if (difficulty === 'intermediate') {
      difficultyInstructions = `
- Focus on core skill practice
- Use moderate number ranges
- Include some variation in problem types`;
    } else {
      difficultyInstructions = `
- Focus on basic skill building
- Use smaller, manageable numbers
- Clear, straightforward problems`;
    }
    
    return `Generate ${questionCount} math questions for a ${classInfo.description} course at ${difficulty} difficulty level.

Requirements:
- Operations: ${operations.split('').join(', ')}
- Number range: ${levelInfo.min_number || 1} to ${maxNum}
- Each question should be appropriate for students at level ${levelInfo.level_number}
${difficultyInstructions}
- All answers must be integers (no fractions or decimals for division problems)
- Ensure division problems result in whole numbers

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "id": 1,
      "question": "What is 15 + 8?",
      "num1": 15,
      "num2": 8,
      "operation": "+",
      "answer": 23,
      "explanation": "To solve 15 + 8, we add 15 and 8 to get 23.",
      "difficulty": "${difficulty}",
      "category": "addition"
    }
  ],
  "metadata": {
    "totalQuestions": ${questionCount},
    "operations": ["${operations.split('').join('", "')}"],
    "difficulty": "${difficulty}",
    "estimatedTime": ${levelInfo.time_limit || 60}
  }
}

Make sure all mathematical calculations are correct and the explanations are clear and educational.`;
  }

  // Parse AI response
  parseAIResponse(content) {
    try {
      const parsed = JSON.parse(content);
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid AI response structure');
      }
      
      return parsed;
    } catch (error) {
      logger.error('Failed to parse AI response', error, { content });
      throw new ValidationError('Invalid AI response format');
    }
  }

  // Validate generated questions
  validateQuestions(questions, classInfo, levelInfo) {
    const requiredFields = ['id', 'question', 'num1', 'num2', 'operation', 'answer', 'explanation'];
    const operations = classInfo.operations.split('');
    const minNum = levelInfo.min_number || 1;
    const maxNum = levelInfo.max_number || 20;
    
    questions.questions.forEach((q, index) => {
      // Check required fields
      for (const field of requiredFields) {
        if (!(field in q)) {
          throw new ValidationError(`Question ${index + 1} missing required field: ${field}`);
        }
      }
      
      // Validate operation
      if (!operations.includes(q.operation)) {
        throw new ValidationError(`Question ${index + 1} has invalid operation: ${q.operation}`);
      }
      
      // Validate number ranges
      if (q.num1 < minNum || q.num1 > maxNum || q.num2 < minNum || q.num2 > maxNum) {
        throw new ValidationError(`Question ${index + 1} numbers out of range`);
      }
      
      // Validate answer calculation
      const calculatedAnswer = this.calculateAnswer(q.num1, q.num2, q.operation);
      if (calculatedAnswer !== q.answer) {
        logger.warn('AI answer mismatch', {
          questionId: q.id,
          expected: calculatedAnswer,
          provided: q.answer
        });
        q.answer = calculatedAnswer; // Auto-correct
      }
    });
    
    logger.info('Questions validated successfully', {
      count: questions.questions.length,
      classId: classInfo.id,
      levelId: levelInfo._id
    });
  }

  // Calculate answer for validation
  calculateAnswer(num1, num2, operation) {
    switch (operation) {
      case '+':
        return num1 + num2;
      case '-':
        return num1 - num2;
      case '*':
        return num1 * num2;
      case '/':
        return Math.floor(num1 / num2);
      default:
        throw new Error(`Invalid operation: ${operation}`);
    }
  }

  // Get difficulty description
  getDifficultyDescription(levelInfo) {
    const level = levelInfo.level_number || 1;
    const maxNum = levelInfo.max_number || 20;
    
    // More sophisticated difficulty based on both level and number range
    if (level <= 2 && maxNum <= 35) return 'beginner';
    if (level <= 3 && maxNum <= 65) return 'intermediate';
    if (level <= 4 && maxNum <= 100) return 'advanced';
    if (maxNum > 100) return 'expert';
    return 'intermediate';
  }

  // Get class information
  async getClassInfo(classId) {
    const { getDb } = require('../db/mongodb');
    const db = await getDb();
    
    return await db.collection('classes').findOne({ id: parseInt(classId) });
  }

  // Get level information
  async getLevelInfo(levelId) {
    const { getDb } = require('../db/mongodb');
    const db = await getDb();
    
    return await db.collection('levels').findOne({ _id: levelId });
  }

  // Fallback question generation (traditional method)
  generateFallbackQuestions(classInfo, levelInfo) {
    logger.warn('Using fallback question generation', {
      classId: classInfo.id,
      levelId: levelInfo._id
    });
    
    const operations = classInfo.operations.split('');
    const questionCount = levelInfo.questions_count || 10;
    const minNum = levelInfo.min_number || 1;
    const maxNum = levelInfo.max_number || 20;
    
    const questions = [];
    
    for (let i = 0; i < questionCount; i++) {
      const operation = operations[Math.floor(Math.random() * operations.length)];
      let num1, num2, answer, question;
      
      switch (operation) {
        case '+':
          num1 = this.randomInt(minNum, maxNum);
          num2 = this.randomInt(minNum, maxNum);
          answer = num1 + num2;
          question = `What is ${num1} + ${num2}?`;
          break;
          
        case '-':
          num1 = this.randomInt(minNum, maxNum);
          num2 = this.randomInt(minNum, Math.min(num1, maxNum));
          answer = num1 - num2;
          question = `What is ${num1} - ${num2}?`;
          break;
          
        case '*':
          num1 = this.randomInt(minNum, Math.min(maxNum, 12));
          num2 = this.randomInt(minNum, Math.min(maxNum, 12));
          answer = num1 * num2;
          question = `What is ${num1} × ${num2}?`;
          break;
          
        case '/':
          num2 = this.randomInt(Math.max(minNum, 1), Math.min(maxNum, 12));
          answer = this.randomInt(1, Math.min(maxNum, 10));
          num1 = num2 * answer;
          question = `What is ${num1} ÷ ${num2}?`;
          break;
      }
      
      questions.push({
        id: i + 1,
        question,
        num1,
        num2,
        operation,
        answer,
        explanation: this.generateExplanation(num1, num2, operation, answer),
        difficulty: this.getDifficultyDescription(levelInfo),
        category: this.getCategory(operation)
      });
    }
    
    return {
      questions,
      metadata: {
        totalQuestions: questionCount,
        operations,
        difficulty: this.getDifficultyDescription(levelInfo),
        estimatedTime: levelInfo.time_limit || 60,
        fallback: true
      }
    };
  }

  // Generate explanation for fallback
  generateExplanation(num1, num2, operation, answer) {
    switch (operation) {
      case '+':
        return `To solve ${num1} + ${num2}, we add ${num1} and ${num2} to get ${answer}.`;
      case '-':
        return `To solve ${num1} - ${num2}, we subtract ${num2} from ${num1} to get ${answer}.`;
      case '*':
        return `To solve ${num1} × ${num2}, we multiply ${num1} by ${num2} to get ${answer}.`;
      case '/':
        return `To solve ${num1} ÷ ${num2}, we divide ${num1} by ${num2} to get ${answer}.`;
      default:
        return `The answer is ${answer}.`;
    }
  }

  // Get category from operation
  getCategory(operation) {
    const categories = {
      '+': 'addition',
      '-': 'subtraction',
      '*': 'multiplication',
      '/': 'division'
    };
    return categories[operation] || 'general';
  }

  // Generate random integer
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Clear AI cache for specific level
  async clearCache(classId, levelId) {
    const cacheKey = `ai:questions:${classId}:${levelId}`;
    await cache.del(cacheKey);
    logger.info('AI questions cache cleared', { classId, levelId });
  }

  // Get AI service status
  async getStatus() {
    if (!this.groq) {
      return {
        status: 'disconnected',
        error: 'GROQ_API_KEY not configured',
        model: this.model,
        cacheEnabled: this.cacheEnabled,
        cacheTTL: this.cacheTTL
      };
    }

    try {
      // Test API connection
      const testResponse = await this.groq.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      });
      
      return {
        status: 'connected',
        model: this.model,
        cacheEnabled: this.cacheEnabled,
        cacheTTL: this.cacheTTL
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
        model: this.model,
        cacheEnabled: this.cacheEnabled,
        cacheTTL: this.cacheTTL
      };
    }
  }
}

// Create singleton instance
const aiQuestionGenerator = new AIQuestionGenerator();

module.exports = aiQuestionGenerator;
