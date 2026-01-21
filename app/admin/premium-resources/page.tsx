import { prisma } from '@/lib/prisma';

interface PremiumResource {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  isPublic: boolean;
  estimatedReadTime: number;
  createdAt: Date;
  _count: {
    accesses: number;
    adSessions: number;
  };
}

async function getPremiumResources(): Promise<PremiumResource[]> {
  try {
    // Temporary mock data since Prisma models aren't generated yet
    return [
      {
        id: '1',
        title: 'Advanced AI Prompting Techniques',
        description: 'Learn advanced techniques for crafting effective AI prompts that get better results.',
        category: 'AI & Machine Learning',
        status: 'PUBLISHED',
        isPublic: true,
        estimatedReadTime: 15,
        createdAt: new Date('2024-01-15'),
        _count: {
          accesses: 245,
          adSessions: 189,
        },
      },
      {
        id: '2',
        title: 'Complete Guide to React Server Components',
        description: 'Comprehensive guide covering React Server Components from basics to advanced patterns.',
        category: 'Web Development',
        status: 'PUBLISHED',
        isPublic: true,
        estimatedReadTime: 25,
        createdAt: new Date('2024-01-10'),
        _count: {
          accesses: 156,
          adSessions: 134,
        },
      },
      {
        id: '3',
        title: 'Database Optimization Strategies',
        description: 'Advanced database optimization techniques for high-performance applications.',
        category: 'Backend Development',
        status: 'DRAFT',
        isPublic: false,
        estimatedReadTime: 20,
        createdAt: new Date('2024-01-12'),
        _count: {
          accesses: 0,
          adSessions: 0,
        },
      },
    ];
  } catch (error) {
    console.error('Error fetching premium resources:', error);
    return [];
  }
}

export default async function PremiumResourcesPage() {
  const resources = await getPremiumResources();

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'PUBLISHED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'DRAFT':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'ARCHIVED':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Premium Resources</h1>
          <p className="text-slate-400">Manage premium content for ChatGPT integration</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-white">{resources.length}</div>
            <div className="text-slate-400 text-sm">Total Resources</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-green-400">
              {resources.filter(r => r.status === 'PUBLISHED').length}
            </div>
            <div className="text-slate-400 text-sm">Published</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-blue-400">
              {resources.reduce((sum, r) => sum + r._count.accesses, 0)}
            </div>
            <div className="text-slate-400 text-sm">Total Accesses</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-purple-400">
              {resources.reduce((sum, r) => sum + r._count.adSessions, 0)}
            </div>
            <div className="text-slate-400 text-sm">Ad Sessions</div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <select className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
              <option value="">All Categories</option>
              <option value="AI & Machine Learning">AI & Machine Learning</option>
              <option value="Web Development">Web Development</option>
              <option value="Backend Development">Backend Development</option>
            </select>
            <select className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
              <option value="">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors">
            Create Resource
          </button>
        </div>

        {/* Resources Table */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Accesses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Ad Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {resources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white">{resource.title}</div>
                        <div className="text-sm text-slate-400 truncate max-w-xs">
                          {resource.description}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {resource.estimatedReadTime} min read
                          {!resource.isPublic && (
                            <span className="ml-2 text-orange-400">• Private</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {resource.category}
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(resource.status)}>
                        {resource.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {resource._count.accesses.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {resource._count.adSessions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {resource.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-2">
                        <button className="text-blue-400 hover:text-blue-300">
                          Edit
                        </button>
                        <button className="text-green-400 hover:text-green-300">
                          View
                        </button>
                        <button className="text-red-400 hover:text-red-300">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-slate-400">
            Showing {resources.length} of {resources.length} resources
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded">
              1
            </button>
            <button className="px-3 py-1 bg-slate-700 text-slate-300 rounded disabled:opacity-50" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
