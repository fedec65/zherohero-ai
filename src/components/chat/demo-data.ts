import { nanoid } from 'nanoid';
import { Chat, Message } from '../../../lib/stores/types';

// Demo chat data for testing
export const DEMO_CHATS: Record<string, Chat> = {
  'chat-1': {
    id: 'chat-1',
    title: 'Getting Started with React',
    folderId: undefined,
    starred: false,
    isIncognito: false,
    modelId: 'gpt-4o-2024-11-20',
    lastMessageAt: new Date('2024-01-20T10:30:00'),
    messageCount: 6,
    createdAt: new Date('2024-01-20T10:00:00'),
    updatedAt: new Date('2024-01-20T10:30:00'),
  },
  'chat-2': {
    id: 'chat-2',
    title: 'Python Data Analysis Help',
    folderId: undefined,
    starred: true,
    isIncognito: false,
    modelId: 'gpt-4o-2024-11-20',
    lastMessageAt: new Date('2024-01-21T14:15:00'),
    messageCount: 8,
    createdAt: new Date('2024-01-21T14:00:00'),
    updatedAt: new Date('2024-01-21T14:15:00'),
  },
  'chat-3': {
    id: 'chat-3',
    title: 'Creative Writing Ideas',
    folderId: undefined,
    starred: false,
    isIncognito: true,
    modelId: 'claude-3-5-sonnet-20241022',
    lastMessageAt: new Date('2024-01-22T09:45:00'),
    messageCount: 4,
    createdAt: new Date('2024-01-22T09:30:00'),
    updatedAt: new Date('2024-01-22T09:45:00'),
  },
};

export const DEMO_MESSAGES: Record<string, Message[]> = {
  'chat-1': [
    {
      id: 'msg-1',
      chatId: 'chat-1',
      role: 'user',
      content: 'Can you help me understand React hooks? I\'m particularly confused about useEffect and its dependency array.',
      createdAt: new Date('2024-01-20T10:00:00'),
      updatedAt: new Date('2024-01-20T10:00:00'),
    },
    {
      id: 'msg-2',
      chatId: 'chat-1',
      role: 'assistant',
      content: `I'd be happy to help you understand React hooks, especially useEffect and its dependency array!

## useEffect Basics

\`useEffect\` is a hook that lets you perform side effects in function components. Think of it as a combination of \`componentDidMount\`, \`componentDidUpdate\`, and \`componentWillUnmount\` from class components.

### Basic Syntax

\`\`\`javascript
useEffect(() => {
  // Side effect code here
  console.log('Component rendered or updated');
});
\`\`\`

## The Dependency Array

The dependency array is the second argument to \`useEffect\`:

\`\`\`javascript
useEffect(() => {
  // Effect code
}, [dependency1, dependency2]); // This is the dependency array
\`\`\`

### Three Scenarios:

1. **No dependency array**: Effect runs after every render
2. **Empty dependency array \`[]\`**: Effect runs only once after initial render
3. **Array with dependencies**: Effect runs when any dependency changes

Would you like me to show you some practical examples?`,
      model: 'gpt-4o-2024-11-20',
      tokens: 245,
      streamingState: 'complete',
      createdAt: new Date('2024-01-20T10:01:00'),
      updatedAt: new Date('2024-01-20T10:01:00'),
    },
    {
      id: 'msg-3',
      chatId: 'chat-1',
      role: 'user',
      content: 'Yes, practical examples would be great! Can you show me how to fetch data with useEffect?',
      createdAt: new Date('2024-01-20T10:02:00'),
      updatedAt: new Date('2024-01-20T10:02:00'),
    },
    {
      id: 'msg-4',
      chatId: 'chat-1',
      role: 'assistant',
      content: `Absolutely! Here are some practical examples of using \`useEffect\` for data fetching:

## Example 1: Basic Data Fetching

\`\`\`javascript
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(\`/api/users/\${userId}\`);
        if (!response.ok) throw new Error('Failed to fetch user');
        
        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]); // Re-run when userId changes

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
\`\`\`

## Example 2: Cleanup with AbortController

\`\`\`javascript
useEffect(() => {
  const controller = new AbortController();
  
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data', {
        signal: controller.signal
      });
      const data = await response.json();
      setData(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
      }
    }
  };

  fetchData();

  // Cleanup function - cancels the request if component unmounts
  return () => {
    controller.abort();
  };
}, []);
\`\`\`

## Key Points:

- ✅ Always include dependencies that are used inside the effect
- ✅ Use cleanup functions to prevent memory leaks
- ✅ Handle loading and error states
- ❌ Don't forget the dependency array (leads to infinite loops)

Would you like to see more examples or have questions about any of these patterns?`,
      model: 'gpt-4o-2024-11-20',
      tokens: 567,
      streamingState: 'complete',
      createdAt: new Date('2024-01-20T10:05:00'),
      updatedAt: new Date('2024-01-20T10:05:00'),
    },
  ],
  'chat-2': [
    {
      id: 'msg-5',
      chatId: 'chat-2',
      role: 'user',
      content: 'I have a CSV file with sales data and I need to analyze trends. Can you help me write a Python script?',
      createdAt: new Date('2024-01-21T14:00:00'),
      updatedAt: new Date('2024-01-21T14:00:00'),
    },
    {
      id: 'msg-6',
      chatId: 'chat-2',
      role: 'assistant',
      content: `I'd be happy to help you analyze sales trends! Here's a comprehensive Python script using pandas and matplotlib:

\`\`\`python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import numpy as np

# Load the CSV file
df = pd.read_csv('sales_data.csv')

# Display basic info about the dataset
print("Dataset Info:")
print(f"Shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
print("\\nFirst few rows:")
print(df.head())

# Convert date column to datetime (adjust column name as needed)
df['date'] = pd.to_datetime(df['date'])

# Set date as index for easier time series analysis
df.set_index('date', inplace=True)

# Basic statistics
print("\\nBasic Statistics:")
print(df.describe())

# Monthly sales trends
monthly_sales = df.resample('M')['sales_amount'].sum()

# Create visualizations
fig, axes = plt.subplots(2, 2, figsize=(15, 10))

# Plot 1: Monthly sales trend
monthly_sales.plot(ax=axes[0,0], title='Monthly Sales Trend', 
                   color='blue', marker='o')
axes[0,0].set_ylabel('Sales Amount')
axes[0,0].grid(True, alpha=0.3)

# Plot 2: Daily sales (if daily data)
df['sales_amount'].plot(ax=axes[0,1], title='Daily Sales', 
                        color='green', alpha=0.7)
axes[0,1].set_ylabel('Sales Amount')
axes[0,1].grid(True, alpha=0.3)

# Plot 3: Sales by day of week
df['day_of_week'] = df.index.day_name()
daily_avg = df.groupby('day_of_week')['sales_amount'].mean()
days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 
              'Friday', 'Saturday', 'Sunday']
daily_avg.reindex(days_order).plot(kind='bar', ax=axes[1,0], 
                                    title='Average Sales by Day of Week')
axes[1,0].set_ylabel('Average Sales')
axes[1,0].tick_params(axis='x', rotation=45)

# Plot 4: Moving average
df['30_day_ma'] = df['sales_amount'].rolling(window=30).mean()
df[['sales_amount', '30_day_ma']].plot(ax=axes[1,1], 
                                       title='Sales with 30-Day Moving Average')
axes[1,1].set_ylabel('Sales Amount')
axes[1,1].legend(['Daily Sales', '30-Day MA'])
axes[1,1].grid(True, alpha=0.3)

plt.tight_layout()
plt.show()

# Calculate key metrics
print("\\nKey Metrics:")
total_sales = df['sales_amount'].sum()
avg_sales = df['sales_amount'].mean()
best_day_amount = df['sales_amount'].max()
best_day_date = df['sales_amount'].idxmax().strftime('%Y-%m-%d')
growth_rate = ((monthly_sales.iloc[-1] / monthly_sales.iloc[-2]) - 1) * 100

print(f"Total Sales: $" + "{:,.2f}".format(total_sales))
print(f"Average Daily Sales: $" + "{:,.2f}".format(avg_sales))
print(f"Best Sales Day: $" + "{:,.2f}".format(best_day_amount) + f" on {best_day_date}")
print(f"Growth Rate (Month-over-Month): " + "{:.2f}%".format(growth_rate))
\`\`\`

This script will help you:
- Load and explore your data
- Visualize monthly and daily trends
- Analyze patterns by day of week
- Calculate moving averages
- Display key performance metrics

Could you share more details about your CSV structure (column names) so I can customize the script further?`,
      model: 'gpt-4o-2024-11-20',
      tokens: 789,
      streamingState: 'complete',
      createdAt: new Date('2024-01-21T14:02:00'),
      updatedAt: new Date('2024-01-21T14:02:00'),
    },
  ],
  'chat-3': [
    {
      id: 'msg-7',
      chatId: 'chat-3',
      role: 'user',
      content: 'I\'m writing a sci-fi story set on Mars. Can you help me brainstorm some unique plot elements?',
      createdAt: new Date('2024-01-22T09:30:00'),
      updatedAt: new Date('2024-01-22T09:30:00'),
    },
    {
      id: 'msg-8',
      chatId: 'chat-3',
      role: 'assistant',
      content: `What an exciting setting! Mars offers incredible storytelling possibilities. Here are some unique plot elements to consider:

## Environmental Challenges as Plot Devices

**The Great Dust Storm**: A planet-wide dust storm lasting months could isolate colonies, disrupt communications, and force characters into unexpected survival situations.

**Ice Mining Conflicts**: Competition over water ice deposits could drive political tensions between different settlements or corporations.

**Terraforming Gone Wrong**: What if an ambitious terraforming project accidentally awakens something dormant in the Martian soil?

## Martian Mysteries

**Ancient Martian Artifacts**: Discovery of technology that responds only to human consciousness, suggesting a deeper connection between Earth and Mars.

**The Missing Expedition**: A research team disappeared 50 years ago, but their perfectly preserved camp is found with signs they left just yesterday.

**Subsurface Ocean Life**: Complex ecosystems thriving in underground water systems, possibly with their own form of intelligence.

## Social & Political Intrigue

**The Independence Movement**: Mars-born colonists ("Martians") developing their own culture and seeking independence from Earth control.

**Corporate Warfare**: Mega-corporations fighting for mining rights, with settlements caught in the middle.

**The Communication Lag**: The 4-24 minute delay in Earth-Mars communication creates opportunities for deception and misunderstandings.

## Unique Martian Elements

**Low Gravity Adventures**: Chase scenes through the canyon systems of Valles Marineris with characters making impossible leaps.

**The Polar Caps**: Seasonal changes that dramatically alter the landscape and atmosphere.

**Magnetic Field Anomalies**: Areas where compasses spin wildly and strange phenomena occur.

What genre within sci-fi are you leaning toward? Hard science fiction, space opera, or something more mysterious and atmospheric?`,
      model: 'claude-3-5-sonnet-20241022',
      tokens: 456,
      streamingState: 'complete',
      createdAt: new Date('2024-01-22T09:32:00'),
      updatedAt: new Date('2024-01-22T09:32:00'),
    },
  ],
};

// Function to load demo data into the store (for development/testing)
export function loadDemoData() {
  if (typeof window !== 'undefined') {
    const demoData = {
      chats: DEMO_CHATS,
      messages: DEMO_MESSAGES,
      activeChat: 'chat-1',
      folders: {},
      searchQuery: '',
      loading: {
        sendMessage: false,
        deleteChat: false,
        createChat: false,
      },
      streamingMessage: null,
    };

    localStorage.setItem('minddeck-chat-store', JSON.stringify({
      state: demoData,
      version: 1,
    }));
  }
}