/**
 * Demo data for testing search functionality
 */

import { Chat, Message } from '../../../lib/stores/types';

export const searchDemoChats: Record<string, Chat> = {
  'chat-1': {
    id: 'chat-1',
    title: 'JavaScript Array Methods',
    starred: false,
    isIncognito: false,
    modelId: 'gpt-4',
    lastMessageAt: new Date('2024-01-15'),
    messageCount: 4,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  'chat-2': {
    id: 'chat-2',
    title: 'Python Data Science Tutorial',
    starred: true,
    isIncognito: false,
    modelId: 'claude-3-sonnet',
    lastMessageAt: new Date('2024-01-14'),
    messageCount: 6,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  'chat-3': {
    id: 'chat-3',
    title: 'React Components Best Practices',
    starred: false,
    isIncognito: true,
    modelId: 'gpt-4',
    lastMessageAt: new Date('2024-01-13'),
    messageCount: 8,
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
  'chat-4': {
    id: 'chat-4',
    title: 'Machine Learning Algorithms',
    starred: true,
    isIncognito: false,
    modelId: 'claude-3-opus',
    lastMessageAt: new Date('2024-01-12'),
    messageCount: 10,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  'chat-5': {
    id: 'chat-5',
    title: 'API Design Patterns',
    starred: false,
    isIncognito: false,
    modelId: 'gpt-3.5-turbo',
    lastMessageAt: new Date('2024-01-11'),
    messageCount: 5,
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
  },
};

export const searchDemoMessages: Record<string, Message[]> = {
  'chat-1': [
    {
      id: 'msg-1-1',
      chatId: 'chat-1',
      role: 'user',
      content: 'Can you explain JavaScript array methods like map, filter, and reduce?',
      createdAt: new Date('2024-01-15T10:00:00'),
      updatedAt: new Date('2024-01-15T10:00:00'),
    },
    {
      id: 'msg-1-2',
      chatId: 'chat-1',
      role: 'assistant',
      content: 'Certainly! JavaScript array methods are powerful tools for data manipulation. Here\'s a breakdown:\n\n**map()**: Creates a new array by transforming each element\n```javascript\nconst numbers = [1, 2, 3, 4];\nconst doubled = numbers.map(num => num * 2);\n// Result: [2, 4, 6, 8]\n```\n\n**filter()**: Creates a new array with elements that pass a test\n```javascript\nconst ages = [15, 18, 21, 12, 25];\nconst adults = ages.filter(age => age >= 18);\n// Result: [18, 21, 25]\n```\n\n**reduce()**: Reduces array to a single value\n```javascript\nconst numbers = [1, 2, 3, 4];\nconst sum = numbers.reduce((acc, num) => acc + num, 0);\n// Result: 10\n```',
      createdAt: new Date('2024-01-15T10:01:00'),
      updatedAt: new Date('2024-01-15T10:01:00'),
    },
    {
      id: 'msg-1-3',
      chatId: 'chat-1',
      role: 'user',
      content: 'What about forEach and find methods?',
      createdAt: new Date('2024-01-15T10:05:00'),
      updatedAt: new Date('2024-01-15T10:05:00'),
    },
    {
      id: 'msg-1-4',
      chatId: 'chat-1',
      role: 'assistant',
      content: 'Great question! Here are two more essential array methods:\n\n**forEach()**: Executes a function for each array element (no return value)\n```javascript\nconst fruits = [\'apple\', \'banana\', \'orange\'];\nfruits.forEach(fruit => console.log(fruit));\n// Logs each fruit to console\n```\n\n**find()**: Returns the first element that satisfies a condition\n```javascript\nconst users = [\n  {id: 1, name: \'John\'}, \n  {id: 2, name: \'Jane\'}\n];\nconst user = users.find(u => u.id === 2);\n// Result: {id: 2, name: \'Jane\'}\n```\n\nKey difference: forEach doesn\'t return anything, while find returns the first matching element or undefined.',
      createdAt: new Date('2024-01-15T10:06:00'),
      updatedAt: new Date('2024-01-15T10:06:00'),
    },
  ],
  'chat-2': [
    {
      id: 'msg-2-1',
      chatId: 'chat-2',
      role: 'user',
      content: 'I want to learn data science with Python. Where should I start?',
      createdAt: new Date('2024-01-14T14:00:00'),
      updatedAt: new Date('2024-01-14T14:00:00'),
    },
    {
      id: 'msg-2-2',
      chatId: 'chat-2',
      role: 'assistant',
      content: 'Excellent choice! Here\'s a structured path to learn Python for data science:\n\n## 1. Python Fundamentals\n- Variables, data types, loops, functions\n- List comprehensions, dictionaries\n- Object-oriented programming basics\n\n## 2. Essential Libraries\n- **NumPy**: Numerical computing\n- **Pandas**: Data manipulation and analysis\n- **Matplotlib/Seaborn**: Data visualization\n- **Scikit-learn**: Machine learning\n\n## 3. Data Analysis Workflow\n1. Data collection and import\n2. Data cleaning and preprocessing\n3. Exploratory data analysis (EDA)\n4. Feature engineering\n5. Model building and evaluation\n6. Results interpretation\n\nWould you like me to elaborate on any of these areas?',
      createdAt: new Date('2024-01-14T14:02:00'),
      updatedAt: new Date('2024-01-14T14:02:00'),
    },
    {
      id: 'msg-2-3',
      chatId: 'chat-2',
      role: 'user',
      content: 'Can you show me a simple example with pandas?',
      createdAt: new Date('2024-01-14T14:10:00'),
      updatedAt: new Date('2024-01-14T14:10:00'),
    },
    {
      id: 'msg-2-4',
      chatId: 'chat-2',
      role: 'assistant',
      content: 'Absolutely! Here\'s a practical pandas example:\n\n```python\nimport pandas as pd\nimport numpy as np\n\n# Create a sample dataset\ndata = {\n    \'Name\': [\'Alice\', \'Bob\', \'Charlie\', \'Diana\'],\n    \'Age\': [25, 30, 35, 28],\n    \'Salary\': [50000, 60000, 70000, 55000],\n    \'Department\': [\'IT\', \'Finance\', \'IT\', \'HR\']\n}\n\n# Create DataFrame\ndf = pd.DataFrame(data)\n\n# Basic operations\nprint(df.head())  # View first 5 rows\nprint(df.describe())  # Statistical summary\nprint(df.groupby(\'Department\')[\'Salary\'].mean())  # Average salary by department\n\n# Filter data\nit_employees = df[df[\'Department\'] == \'IT\']\nhigh_earners = df[df[\'Salary\'] > 55000]\n\n# Add new column\ndf[\'Salary_Category\'] = df[\'Salary\'].apply(\n    lambda x: \'High\' if x > 60000 else \'Medium\' if x > 50000 else \'Low\'\n)\n```\n\nThis example shows DataFrame creation, basic analysis, filtering, and feature engineering.',
      createdAt: new Date('2024-01-14T14:12:00'),
      updatedAt: new Date('2024-01-14T14:12:00'),
    },
  ],
  'chat-3': [
    {
      id: 'msg-3-1',
      chatId: 'chat-3',
      role: 'user',
      content: 'What are the best practices for React components?',
      createdAt: new Date('2024-01-13T16:00:00'),
      updatedAt: new Date('2024-01-13T16:00:00'),
    },
    {
      id: 'msg-3-2',
      chatId: 'chat-3',
      role: 'assistant',
      content: 'Here are essential React component best practices:\n\n## 1. Component Structure\n- **Single Responsibility**: Each component should have one clear purpose\n- **Small Components**: Keep components focused and manageable\n- **Proper Naming**: Use PascalCase for components\n\n## 2. Props and State\n- **Immutable Props**: Never mutate props directly\n- **Destructure Props**: Extract what you need at the top\n- **Default Props**: Use defaultProps or default parameters\n- **PropTypes**: Define prop types for validation\n\n## 3. Performance\n- **React.memo**: Prevent unnecessary re-renders\n- **useMemo/useCallback**: Memoize expensive calculations\n- **Lazy Loading**: Use React.lazy for code splitting\n\n## 4. Code Organization\n- **Consistent File Structure**: Group related files\n- **Custom Hooks**: Extract reusable logic\n- **Error Boundaries**: Handle errors gracefully\n\nWould you like me to show examples for any of these?',
      createdAt: new Date('2024-01-13T16:02:00'),
      updatedAt: new Date('2024-01-13T16:02:00'),
    },
  ],
  'chat-4': [
    {
      id: 'msg-4-1',
      chatId: 'chat-4',
      role: 'user',
      content: 'Explain the difference between supervised and unsupervised learning',
      createdAt: new Date('2024-01-12T09:00:00'),
      updatedAt: new Date('2024-01-12T09:00:00'),
    },
    {
      id: 'msg-4-2',
      chatId: 'chat-4',
      role: 'assistant',
      content: 'Great question! Here\'s a comprehensive comparison:\n\n## Supervised Learning\n**Definition**: Learning with labeled training data\n\n**Characteristics**:\n- Has input-output pairs (X, y)\n- Algorithm learns to map inputs to correct outputs\n- Performance can be measured against known answers\n\n**Types**:\n1. **Classification**: Predicts categories (spam/not spam)\n2. **Regression**: Predicts continuous values (house prices)\n\n**Examples**:\n- Email spam detection\n- Image recognition\n- Stock price prediction\n- Medical diagnosis\n\n**Algorithms**: Linear Regression, Decision Trees, Random Forest, SVM, Neural Networks\n\n## Unsupervised Learning\n**Definition**: Learning patterns in data without labels\n\n**Characteristics**:\n- Only has input data (X), no target outputs\n- Finds hidden patterns or structures\n- Success harder to measure objectively\n\n**Types**:\n1. **Clustering**: Groups similar data points\n2. **Association**: Finds rules between variables\n3. **Dimensionality Reduction**: Simplifies data while preserving information\n\n**Examples**:\n- Customer segmentation\n- Recommendation systems\n- Anomaly detection\n- Data compression\n\n**Algorithms**: K-Means, Hierarchical Clustering, PCA, DBSCAN\n\n## Key Differences\n| Aspect | Supervised | Unsupervised |\n|--------|------------|-------------|\n| Data | Labeled | Unlabeled |\n| Goal | Predict outcomes | Find patterns |\n| Evaluation | Clear metrics | Subjective |\n| Complexity | More straightforward | More exploratory |',
      createdAt: new Date('2024-01-12T09:03:00'),
      updatedAt: new Date('2024-01-12T09:03:00'),
    },
  ],
  'chat-5': [
    {
      id: 'msg-5-1',
      chatId: 'chat-5',
      role: 'user',
      content: 'What are RESTful API design patterns?',
      createdAt: new Date('2024-01-11T11:00:00'),
      updatedAt: new Date('2024-01-11T11:00:00'),
    },
    {
      id: 'msg-5-2',
      chatId: 'chat-5',
      role: 'assistant',
      content: 'Here are key RESTful API design patterns:\n\n## 1. Resource-Based URLs\n- Use nouns, not verbs: `/users` not `/getUsers`\n- Hierarchical structure: `/users/123/orders/456`\n- Plural nouns for collections: `/products`\n\n## 2. HTTP Methods\n- **GET**: Retrieve data (idempotent)\n- **POST**: Create new resources\n- **PUT**: Update entire resource (idempotent)\n- **PATCH**: Partial updates\n- **DELETE**: Remove resources (idempotent)\n\n## 3. Status Codes\n- **200**: OK (successful GET, PUT, PATCH)\n- **201**: Created (successful POST)\n- **204**: No Content (successful DELETE)\n- **400**: Bad Request (client error)\n- **401**: Unauthorized\n- **404**: Not Found\n- **500**: Internal Server Error\n\n## 4. Response Format\n```json\n{\n  \"data\": {...},\n  \"meta\": {\n    \"page\": 1,\n    \"limit\": 20,\n    \"total\": 100\n  },\n  \"links\": {\n    \"self\": \"/api/users?page=1\",\n    \"next\": \"/api/users?page=2\"\n  }\n}\n```\n\n## 5. Best Practices\n- Consistent naming conventions\n- Version your APIs: `/v1/users`\n- Use query parameters for filtering/sorting\n- Implement proper authentication\n- Rate limiting and caching\n- Comprehensive documentation',
      createdAt: new Date('2024-01-11T11:03:00'),
      updatedAt: new Date('2024-01-11T11:03:00'),
    },
  ],
};

/**
 * Helper function to populate the chat store with demo data
 */
export function loadSearchDemoData(chatStore: any) {
  // Load chats
  Object.values(searchDemoChats).forEach(chat => {
    chatStore.setState((state: any) => {
      state.chats[chat.id] = chat;
    });
  });

  // Load messages
  Object.entries(searchDemoMessages).forEach(([chatId, messages]) => {
    chatStore.setState((state: any) => {
      state.messages[chatId] = messages;
    });
  });
}