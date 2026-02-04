import fetch from 'node-fetch';

export class DynamicDataService {
  constructor() {
    this.userCache = new Map();
    this.contentCache = new Map();
    this.lastFetch = 0;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  // Generate dynamic users from external APIs
  async getDynamicUsers() {
    const now = Date.now();
    if (this.userCache.size > 0 && (now - this.lastFetch) < this.cacheDuration) {
      return Array.from(this.userCache.values());
    }

    try {
      // Fetch random users from JSONPlaceholder API
      const response = await fetch('https://jsonplaceholder.typicode.com/users');
      const apiUsers = await response.json();

      // Generate additional dynamic users
      const dynamicUsers = [];

      // Use API users as base
      apiUsers.forEach((user, index) => {
        const avatars = ['👨‍💻', '👩‍💼', '👨‍🎨', '👩‍🔬', '👨‍🚀', '👩‍⚕️', '👨‍🏫', '👩‍🎭', '👨‍🔧', '👩‍🍳'];
        dynamicUsers.push({
          id: `user_${user.id}`,
          name: user.name,
          username: user.username,
          email: user.email,
          avatar: avatars[index % avatars.length],
          company: user.company?.name,
          website: user.website,
          city: user.address?.city,
          isOnline: Math.random() > 0.3, // 70% chance online
          lastSeen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          followers: Math.floor(Math.random() * 10000),
          following: Math.floor(Math.random() * 1000)
        });
      });

      // Add some generated users for variety
      for (let i = 11; i <= 20; i++) {
        const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Sage', 'River'];
        const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez'];
        const avatars = ['🧑‍💻', '👨‍🎨', '👩‍🔬', '🧑‍🚀', '👨‍⚕️', '👩‍🏫', '🧑‍🎭', '👨‍🔧', '👩‍🍳', '🧑‍🌾'];

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

        dynamicUsers.push({
          id: `user_${i}`,
          name: `${firstName} ${lastName}`,
          username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
          avatar: avatars[Math.floor(Math.random() * avatars.length)],
          company: `${lastName} Corp`,
          isOnline: Math.random() > 0.4,
          lastSeen: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
          followers: Math.floor(Math.random() * 5000),
          following: Math.floor(Math.random() * 800)
        });
      }

      // Cache the users
      this.userCache.clear();
      dynamicUsers.forEach(user => this.userCache.set(user.id, user));
      this.lastFetch = now;

      return dynamicUsers;
    } catch (error) {
      console.error('Error fetching dynamic users:', error);
      // Fallback to minimal generated users
      return this.generateFallbackUsers();
    }
  }

  generateFallbackUsers() {
    const users = [];
    for (let i = 1; i <= 10; i++) {
      users.push({
        id: `user_${i}`,
        name: `User ${i}`,
        username: `user${i}`,
        email: `user${i}@example.com`,
        avatar: '👤',
        isOnline: Math.random() > 0.5,
        lastSeen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        followers: Math.floor(Math.random() * 1000),
        following: Math.floor(Math.random() * 200)
      });
    }
    return users;
  }

  // Generate dynamic content from external APIs
  async getDynamicContent() {
    try {
      const [posts, photos, todos] = await Promise.all([
        fetch('https://jsonplaceholder.typicode.com/posts').then(r => r.json()),
        fetch('https://jsonplaceholder.typicode.com/photos?_limit=50').then(r => r.json()),
        fetch('https://jsonplaceholder.typicode.com/todos?_limit=30').then(r => r.json())
      ]);

      const content = {
        posts: posts.slice(0, 20).map(post => ({
          id: `post_${post.id}`,
          title: post.title,
          body: post.body,
          userId: `user_${post.userId}`,
          type: 'post'
        })),
        photos: photos.map(photo => ({
          id: `photo_${photo.id}`,
          title: photo.title,
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl,
          userId: `user_${photo.albumId}`,
          type: 'photo'
        })),
        projects: todos.map(todo => ({
          id: `project_${todo.id}`,
          title: todo.title,
          completed: todo.completed,
          userId: `user_${todo.userId}`,
          type: 'project'
        }))
      };

      // Add some generated content types
      content.videos = this.generateVideos();
      content.articles = this.generateArticles();
      content.products = this.generateProducts();

      return content;
    } catch (error) {
      console.error('Error fetching dynamic content:', error);
      return this.generateFallbackContent();
    }
  }

  generateVideos() {
    const videoTopics = [
      'How to build a REST API',
      'React Hooks Tutorial',
      'Database Design Principles',
      'Machine Learning Basics',
      'Web Security Best Practices',
      'Docker for Beginners',
      'GraphQL vs REST',
      'Microservices Architecture',
      'Cloud Computing Overview',
      'DevOps Pipeline Setup'
    ];

    return videoTopics.map((topic, index) => ({
      id: `video_${index + 1}`,
      title: topic,
      duration: `${Math.floor(Math.random() * 30) + 5}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      views: Math.floor(Math.random() * 100000),
      userId: `user_${Math.floor(Math.random() * 10) + 1}`,
      type: 'video'
    }));
  }

  generateArticles() {
    const articleTopics = [
      'The Future of Web Development',
      'Understanding Async/Await in JavaScript',
      'Building Scalable Applications',
      'Database Optimization Techniques',
      'Modern CSS Layout Methods',
      'API Design Best Practices',
      'Testing Strategies for Web Apps',
      'Performance Optimization Tips',
      'Security in Modern Web Apps',
      'Deployment and DevOps'
    ];

    return articleTopics.map((topic, index) => ({
      id: `article_${index + 1}`,
      title: topic,
      readTime: `${Math.floor(Math.random() * 15) + 3} min read`,
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      userId: `user_${Math.floor(Math.random() * 10) + 1}`,
      type: 'article'
    }));
  }

  generateProducts() {
    const productCategories = [
      { name: 'Laptop', price: 999 },
      { name: 'Smartphone', price: 699 },
      { name: 'Headphones', price: 199 },
      { name: 'Keyboard', price: 129 },
      { name: 'Monitor', price: 299 },
      { name: 'Mouse', price: 49 },
      { name: 'Webcam', price: 89 },
      { name: 'Tablet', price: 399 },
      { name: 'Smartwatch', price: 249 },
      { name: 'Speaker', price: 159 }
    ];

    return productCategories.map((product, index) => ({
      id: `product_${index + 1}`,
      title: `${product.name} Pro ${2024}`,
      price: product.price + Math.floor(Math.random() * 200),
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
      reviews: Math.floor(Math.random() * 1000),
      userId: `user_${Math.floor(Math.random() * 10) + 1}`,
      type: 'product'
    }));
  }

  generateFallbackContent() {
    return {
      posts: Array.from({ length: 10 }, (_, i) => ({
        id: `post_${i + 1}`,
        title: `Dynamic Post ${i + 1}`,
        body: `This is a dynamically generated post content ${i + 1}`,
        userId: `user_${Math.floor(Math.random() * 10) + 1}`,
        type: 'post'
      })),
      photos: Array.from({ length: 10 }, (_, i) => ({
        id: `photo_${i + 1}`,
        title: `Dynamic Photo ${i + 1}`,
        userId: `user_${Math.floor(Math.random() * 10) + 1}`,
        type: 'photo'
      })),
      projects: Array.from({ length: 10 }, (_, i) => ({
        id: `project_${i + 1}`,
        title: `Dynamic Project ${i + 1}`,
        userId: `user_${Math.floor(Math.random() * 10) + 1}`,
        type: 'project'
      }))
    };
  }

  // Generate realistic event based on current dynamic data
  async generateRealisticEvent() {
    const users = await this.getDynamicUsers();
    const content = await this.getDynamicContent();

    const actor = users[Math.floor(Math.random() * users.length)];
    const verbs = ['like', 'comment', 'share', 'follow', 'purchase', 'create', 'update', 'view', 'bookmark', 'subscribe'];
    const verb = verbs[Math.floor(Math.random() * verbs.length)];

    // Select random content from all types
    const allContent = [
      ...content.posts,
      ...content.photos,
      ...content.projects,
      ...content.videos,
      ...content.articles,
      ...content.products
    ];

    const targetContent = allContent[Math.floor(Math.random() * allContent.length)];

    // Generate realistic target users (followers, friends, etc.)
    const targetUsers = users
      .filter(u => u.id !== actor.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 4) + 1)
      .map(u => u.id);

    return {
      actor_id: actor.id,
      actor_name: actor.name,
      verb,
      object_type: targetContent.type,
      object_id: targetContent.id,
      object_title: targetContent.title,
      target_user_ids: targetUsers,
      created_at: new Date().toISOString(),
      // Additional dynamic metadata
      metadata: {
        actor_avatar: actor.avatar,
        actor_company: actor.company,
        content_details: {
          price: targetContent.price,
          duration: targetContent.duration,
          readTime: targetContent.readTime,
          views: targetContent.views,
          rating: targetContent.rating
        }
      }
    };
  }

  // Get user by ID with dynamic data
  async getUserById(userId) {
    const users = await this.getDynamicUsers();
    return users.find(u => u.id === userId);
  }

  // Get content by ID and type
  async getContentById(contentId, contentType) {
    const content = await this.getDynamicContent();
    const allContent = [
      ...content.posts,
      ...content.photos,
      ...content.projects,
      ...content.videos,
      ...content.articles,
      ...content.products
    ];

    return allContent.find(c => c.id === contentId && c.type === contentType);
  }

  // Get trending topics from external sources
  async getTrendingTopics() {
    try {
      // In a real app, this could fetch from Twitter API, Reddit API, etc.
      // For now, we'll simulate with dynamic generation
      const topics = [
        'WebDevelopment', 'React', 'NodeJS', 'AI', 'MachineLearning',
        'CloudComputing', 'DevOps', 'Cybersecurity', 'Blockchain', 'IoT'
      ];

      return topics.map(topic => ({
        name: topic,
        posts: Math.floor(Math.random() * 10000),
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: `${Math.floor(Math.random() * 50)}%`
      }));
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  }
}