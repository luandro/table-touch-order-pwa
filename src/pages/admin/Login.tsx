
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple demo authentication
    if (credentials.email === 'admin@bellavista.com' && credentials.password === 'admin123') {
      localStorage.setItem('adminAuth', 'true');
      navigate('/admin');
    } else {
      setError(t('admin.login.invalidCredentials'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">BV</span>
          </div>
          <CardTitle className="text-2xl text-orange-600">{t('admin.login.title')}</CardTitle>
          <p className="text-gray-600">{t('admin.login.subtitle')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t('common.labels.email')}</Label>
              <Input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                placeholder={t('admin.login.emailPlaceholder')}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">{t('common.labels.password')}</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                placeholder={t('admin.login.passwordPlaceholder')}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
              {t('common.buttons.login')}
            </Button>
          </form>
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            <p className="font-medium">{t('admin.login.demoCredentials')}</p>
            <p>{t('admin.login.demoEmail')}</p>
            <p>{t('admin.login.demoPassword')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
