function generateQuestion(operations = '+-', minNum = 1, maxNum = 20) {
  const ops = operations.split('');
  const op = ops[Math.floor(Math.random() * ops.length)];
  let num1, num2, answer;

  switch (op) {
    case '+':
      num1 = randInt(minNum, maxNum);
      num2 = randInt(minNum, maxNum);
      answer = num1 + num2;
      break;
    case '-':
      num1 = randInt(minNum, maxNum);
      num2 = randInt(minNum, num1);
      answer = num1 - num2;
      break;
    case '*':
      num1 = randInt(minNum, Math.min(maxNum, 12));
      num2 = randInt(minNum, Math.min(maxNum, 12));
      answer = num1 * num2;
      break;
    case '/':
      num2 = randInt(Math.max(minNum, 1), Math.min(maxNum, 12));
      answer = randInt(1, Math.min(maxNum, 10));
      num1 = num2 * answer;
      break;
    default:
      num1 = randInt(minNum, maxNum);
      num2 = randInt(minNum, maxNum);
      answer = num1 + num2;
  }

  return { num1, num2, operation: op, answer };
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { generateQuestion };
