'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { auth } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Key, Plus, Copy, Check, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { apiClient } from '@/lib/apiClient';
import type { components } from '@/types/api.gen';

type ApiKeyResponse = components['schemas']['ApiKeyResponse'];
type ApiKeyCreate = components['schemas']['ApiKeyCreate'];

const ApiKeyCard = ({ apiKey, onDelete }: { apiKey: ApiKeyResponse; onDelete: (id: number) => void }) => {
  const { t } = useTranslation();
  const { copied, copy } = useCopyToClipboard();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.deleteApiKey(apiKey.id);
      onDelete(apiKey.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete API key:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? '活跃' : '已禁用'}
      </Badge>
    );
  };

  const maskedKey = `sk_live_${'*'.repeat(24)}${apiKey.key_prefix}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <CardTitle className="text-base">{apiKey.note}</CardTitle>
            {getStatusBadge(!apiKey.revoked)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy(maskedKey)}
              className="h-8 px-2"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    删除 API Key
                  </DialogTitle>
                  <DialogDescription>
                    确定要删除 API Key "{apiKey.note}" 吗？此操作不可撤销，使用此密钥的应用将无法继续访问。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    取消
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? '删除中...' : '确认删除'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">API Key</Label>
            <div className="font-mono text-sm bg-muted p-2 rounded mt-1">
              {maskedKey}
            </div>
          </div>
          
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <Label className="text-muted-foreground">创建时间</Label>
              <p className="mt-1">{formatDate(apiKey.created_at)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">最后使用</Label>
              <p className="mt-1">
                {apiKey.last_used_at ? formatDate(apiKey.last_used_at) : '从未使用'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CreateApiKeyDialog = ({ onCreated }: { onCreated: (apiKey: ApiKeyResponse, plainKey: string) => void }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<ApiKeyCreate>({
    note: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await apiClient.createApiKey(formData);
      onCreated(response, response.api_key);
      setOpen(false);
      setFormData({ note: '' });
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mb-6">
          <Plus className="h-4 w-4 mr-2" />
          创建 API Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>创建新的 API Key</DialogTitle>
            <DialogDescription>
              创建一个新的 API Key 用于访问 OSS API。请妥善保管密钥，它只会显示一次。
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="note">备注 *</Label>
              <Input
                id="note"
                placeholder="例如：生产环境密钥"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isCreating || !formData.note.trim()}>
              {isCreating ? '创建中...' : '创建密钥'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const NewApiKeyDialog = ({ 
  apiKey, 
  plainKey, 
  open, 
  onClose 
}: { 
  apiKey: ApiKeyResponse | null; 
  plainKey: string; 
  open: boolean; 
  onClose: () => void; 
}) => {
  const { copied, copy } = useCopyToClipboard();
  const [showKey, setShowKey] = useState(false);

  if (!apiKey) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            API Key 创建成功
          </DialogTitle>
          <DialogDescription>
            请立即复制并保存您的 API Key。出于安全考虑，我们不会再次显示完整密钥。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">名称</Label>
            <p className="text-sm text-muted-foreground mt-1">{apiKey.note}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium">API Key</Label>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 font-mono text-sm bg-muted p-3 rounded border">
                {showKey ? plainKey : '•'.repeat(plainKey.length)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(plainKey)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">重要提醒</p>
                <p className="text-amber-700 mt-1">
                  这是您唯一一次看到完整的 API Key。请立即复制并安全保存。
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            我已保存密钥
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ApiKeysPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKeyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [newApiKey, setNewApiKey] = useState<ApiKeyResponse | null>(null);
  const [newPlainKey, setNewPlainKey] = useState('');
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);

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

  const fetchApiKeys = async () => {
    try {
      const response = await apiClient.listApiKeys();
      setApiKeys(response);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApiKeys();
    }
  }, [isAuthenticated]);

  const handleApiKeyCreated = (apiKey: ApiKeyResponse, plainKey: string) => {
    setApiKeys([apiKey, ...apiKeys]);
    setNewApiKey(apiKey);
    setNewPlainKey(plainKey);
    setShowNewKeyDialog(true);
  };

  const handleApiKeyDeleted = (deletedId: number) => {
    setApiKeys(apiKeys.filter(key => key.id !== deletedId));
  };

  const handleNewKeyDialogClose = () => {
    setShowNewKeyDialog(false);
    setNewApiKey(null);
    setNewPlainKey('');
  };

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

  if (loading) {
    return (
      <AuthenticatedLayout onLogout={handleLogout}>
        <div className="container mx-auto py-6 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout onLogout={handleLogout}>
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Key className="h-8 w-8" />
            API Key 管理
          </h1>
          <p className="text-muted-foreground mt-2">
            管理您的 API 密钥，用于程序化访问 OSS 服务
          </p>
        </div>

        <CreateApiKeyDialog onCreated={handleApiKeyCreated} />

        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无 API Key</h3>
              <p className="text-muted-foreground mb-6">
                创建您的第一个 API Key 开始使用程序化接口
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <ApiKeyCard
                key={apiKey.id}
                apiKey={apiKey}
                onDelete={handleApiKeyDeleted}
              />
            ))}
          </div>
        )}

        <NewApiKeyDialog
          apiKey={newApiKey}
          plainKey={newPlainKey}
          open={showNewKeyDialog}
          onClose={handleNewKeyDialogClose}
        />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}