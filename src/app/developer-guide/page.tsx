'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { auth } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink, Key, Upload, Download, Trash2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

const IntroCard = () => {
  const { t } = useTranslation();
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          {t('developerGuide.intro.title')}
        </CardTitle>
        <CardDescription>
          {t('developerGuide.intro.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">RESTful</div>
            <div className="text-sm text-muted-foreground mt-1">API 架构</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">JWT + API Key</div>
            <div className="text-sm text-muted-foreground mt-1">双认证支持</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">OpenAPI</div>
            <div className="text-sm text-muted-foreground mt-1">标准文档</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const QuickStartTabs = () => {
  const { t } = useTranslation();
  const { copied, copy } = useCopyToClipboard();

  const CopyButton = ({ text }: { text: string }) => (
    <Button
      variant="outline"
      size="sm"
      className="absolute top-2 right-2"
      onClick={() => copy(text)}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );

  const curlExamples = {
    upload: `curl -X POST "https://oss.xiaojinpro.com/api/files/upload" \\
  -H "Authorization: ApiKey YOUR_API_KEY" \\
  -F "file=@example.jpg" \\
  -F "folder=images"`,
    
    list: `curl -X GET "https://oss.xiaojinpro.com/api/files/" \\
  -H "Authorization: ApiKey YOUR_API_KEY"`,
    
    delete: `curl -X DELETE "https://oss.xiaojinpro.com/api/files/123" \\
  -H "Authorization: ApiKey YOUR_API_KEY"`
  };

  const pythonExamples = {
    upload: `import requests

# 上传文件
url = "https://oss.xiaojinpro.com/api/files/upload"
headers = {"Authorization": "ApiKey YOUR_API_KEY"}
files = {"file": open("example.jpg", "rb")}
data = {"folder": "images"}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())`,

    list: `import requests

# 获取文件列表
url = "https://oss.xiaojinpro.com/api/files/"
headers = {"Authorization": "ApiKey YOUR_API_KEY"}

response = requests.get(url, headers=headers)
files = response.json()
print(f"共 {len(files)} 个文件")`
  };

  const jsExamples = {
    upload: `// 使用 fetch API 上传文件
const uploadFile = async (file, folder = '') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch('https://oss.xiaojinpro.com/api/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': 'ApiKey YOUR_API_KEY'
    },
    body: formData
  });

  return await response.json();
};`,

    list: `// 获取文件列表
const getFiles = async () => {
  const response = await fetch('https://oss.xiaojinpro.com/api/files/', {
    headers: {
      'Authorization': 'ApiKey YOUR_API_KEY'
    }
  });

  return await response.json();
};`
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('developerGuide.quickStart.title')}</CardTitle>
        <CardDescription>
          {t('developerGuide.quickStart.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="curl" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
          </TabsList>
          
          <TabsContent value="curl" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  上传文件
                </h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{curlExamples.upload}</code>
                  </pre>
                  <CopyButton text={curlExamples.upload} />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  获取文件列表
                </h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{curlExamples.list}</code>
                  </pre>
                  <CopyButton text={curlExamples.list} />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  删除文件
                </h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{curlExamples.delete}</code>
                  </pre>
                  <CopyButton text={curlExamples.delete} />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="python" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  上传文件
                </h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{pythonExamples.upload}</code>
                  </pre>
                  <CopyButton text={pythonExamples.upload} />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  获取文件列表
                </h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{pythonExamples.list}</code>
                  </pre>
                  <CopyButton text={pythonExamples.list} />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="javascript" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  上传文件
                </h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{jsExamples.upload}</code>
                  </pre>
                  <CopyButton text={jsExamples.upload} />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  获取文件列表
                </h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{jsExamples.list}</code>
                  </pre>
                  <CopyButton text={jsExamples.list} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const EndpointTable = () => {
  const { t } = useTranslation();

  const endpoints = [
    {
      method: 'POST',
      path: '/api/files/upload',
      description: '上传文件',
      auth: 'JWT / API Key'
    },
    {
      method: 'GET',
      path: '/api/files/',
      description: '获取文件列表',
      auth: 'JWT / API Key'
    },
    {
      method: 'GET',
      path: '/api/files/{file_id}',
      description: '获取文件详情',
      auth: 'JWT / API Key'
    },
    {
      method: 'DELETE',
      path: '/api/files/{file_id}',
      description: '删除文件',
      auth: 'JWT / API Key'
    },
    {
      method: 'POST',
      path: '/api/files/{file_id}/multipart-upload',
      description: '初始化分片上传',
      auth: 'JWT / API Key'
    },
    {
      method: 'POST',
      path: '/api/files/multipart-upload/{upload_id}/complete',
      description: '完成分片上传',
      auth: 'JWT / API Key'
    },
    {
      method: 'POST',
      path: '/api/api-keys/',
      description: '创建 API Key',
      auth: 'JWT'
    },
    {
      method: 'GET',
      path: '/api/api-keys/',
      description: '获取 API Key 列表',
      auth: 'JWT'
    },
    {
      method: 'DELETE',
      path: '/api/api-keys/{key_id}',
      description: '删除 API Key',
      auth: 'JWT'
    }
  ];

  const getMethodBadge = (method: string) => {
    const variants = {
      'GET': 'secondary',
      'POST': 'default',
      'DELETE': 'destructive',
      'PUT': 'outline'
    } as const;
    
    return <Badge variant={variants[method as keyof typeof variants] || 'outline'}>{method}</Badge>;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('developerGuide.endpoints.title')}</CardTitle>
        <CardDescription>
          {t('developerGuide.endpoints.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">方法</th>
                <th className="text-left p-2 font-medium">端点</th>
                <th className="text-left p-2 font-medium">描述</th>
                <th className="text-left p-2 font-medium">认证</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    {getMethodBadge(endpoint.method)}
                  </td>
                  <td className="p-2 font-mono text-sm">
                    {endpoint.path}
                  </td>
                  <td className="p-2">
                    {endpoint.description}
                  </td>
                  <td className="p-2">
                    <Badge variant="outline">{endpoint.auth}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const ErrorCodeAccordion = () => {
  const { t } = useTranslation();

  const errorCodes = [
    {
      code: '400',
      title: 'Bad Request',
      description: '请求参数错误或格式不正确',
      examples: ['缺少必需参数', '文件格式不支持', '请求体格式错误']
    },
    {
      code: '401',
      title: 'Unauthorized',
      description: '未提供认证信息或认证失败',
      examples: ['缺少 Authorization 头', 'JWT Token 过期', 'API Key 无效']
    },
    {
      code: '403',
      title: 'Forbidden',
      description: '没有访问权限',
      examples: ['API Key 被禁用', '超出配额限制', '访问其他用户资源']
    },
    {
      code: '404',
      title: 'Not Found',
      description: '请求的资源不存在',
      examples: ['文件不存在', 'API 端点不存在', 'Upload ID 不存在']
    },
    {
      code: '429',
      title: 'Too Many Requests',
      description: '请求频率超过限制',
      examples: ['每分钟请求次数过多', 'API Key 达到速率限制']
    },
    {
      code: '500',
      title: 'Internal Server Error',
      description: '服务器内部错误',
      examples: ['存储服务不可用', '数据库连接失败', '未知系统错误']
    }
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('developerGuide.errorCodes.title')}</CardTitle>
        <CardDescription>
          {t('developerGuide.errorCodes.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {errorCodes.map((error, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-mono">
                  {error.code}
                </Badge>
                <h4 className="font-medium">{error.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {error.description}
              </p>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">常见情况：</p>
                <ul className="text-xs space-y-1">
                  {error.examples.map((example, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const SDKLinks = () => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('developerGuide.sdks.title')}</CardTitle>
        <CardDescription>
          {t('developerGuide.sdks.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">OpenAPI 规范</h4>
            <p className="text-sm text-muted-foreground mb-3">
              获取完整的 API 规范文档，支持代码生成
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://oss.xiaojinpro.com/openapi.json" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                openapi.json
              </a>
            </Button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Swagger UI</h4>
            <p className="text-sm text-muted-foreground mb-3">
              在线测试 API 接口，查看详细文档
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://oss.xiaojinpro.com/docs" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                API 文档
              </a>
            </Button>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">生成 SDK</h4>
          <p className="text-sm text-muted-foreground mb-3">
            使用 OpenAPI Generator 为你的编程语言生成 SDK：
          </p>
          <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
            <code>
{`# 安装 OpenAPI Generator
npm install @openapitools/openapi-generator-cli -g

# 生成 Python SDK
openapi-generator-cli generate \\
  -i https://oss.xiaojinpro.com/openapi.json \\
  -g python \\
  -o ./oss-python-sdk

# 生成 JavaScript SDK  
openapi-generator-cli generate \\
  -i https://oss.xiaojinpro.com/openapi.json \\
  -g javascript \\
  -o ./oss-js-sdk`}
            </code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DeveloperGuidePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const token = auth.getToken();
    if (token) {
      try {
        const isValid = await auth.verifyToken(token);
        setIsAuthenticated(isValid);
        if (!isValid) {
          router.push('/');
        }
      } catch {
        setIsAuthenticated(false);
        router.push('/');
      }
    } else {
      router.push('/');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-stone-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AuthenticatedLayout onLogout={handleLogout}>
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t('developerGuide.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('developerGuide.subtitle')}
          </p>
        </div>

        <IntroCard />
        <QuickStartTabs />
        <EndpointTable />
        <ErrorCodeAccordion />
        <SDKLinks />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}