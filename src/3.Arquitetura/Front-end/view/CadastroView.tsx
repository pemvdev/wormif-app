import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Briefcase, Camera, Linkedin, Lock, Mail, Target, User, UserPlus, Users } from 'lucide-react';
import { Card } from '@Front-end/components/ui/card';
import { Button } from '@Front-end/components/ui/button';
import { Input } from '@Front-end/components/ui/input';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@Front-end/components/ui/field';
import { AuthNotice } from '@Front-end/components/layout/AuthNotice';
import { useApp } from '@Front-end/context/AppContext';
import { readAuthRedirectState } from '@Front-end/utils/authRedirect';
import { RadioGroup, RadioGroupItem } from '@Front-end/components/ui/radio-group';
import { Switch } from '@Front-end/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@Front-end/components/ui/avatar';
import type { IntuitoUsoAplicacao } from '@Front-end/dto/AuthDTO';
import { readProfilePhoto } from '@Front-end/utils/profilePhoto';

export default function CadastroView() {
  const { register } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { from: redirectTo = '/upload', message: authMessage } = readAuthRedirectState(
    location.state
  );
  const authLinkState = authMessage ? { from: redirectTo, message: authMessage } : { from: redirectTo };
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [profissao, setProfissao] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState('');
  const [intuitoUso, setIntuitoUso] = useState<IntuitoUsoAplicacao>('CURIOSIDADE');
  const [permiteAnalisePorTerceiros, setPermiteAnalisePorTerceiros] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handlePhotoChange = async (file?: File) => {
    setError(null);
    setFotoPerfilUrl('');

    if (!file) return;
    try {
      setFotoPerfilUrl(await readProfilePhoto(file));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível carregar a foto de perfil.');
    }
  };

  const isValidLinkedin = (value: string) => {
    try {
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase();
      return url.protocol === 'https:' && (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com'));
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (!e.currentTarget.reportValidity()) return;

    if (!name.trim()) {
      setError('Informe seu nome.');
      setStep(1);
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    if (intuitoUso === 'ANALISAR_OUTRAS_PESSOAS' && !profissao.trim()) {
      setError('Informe sua profissão.');
      return;
    }
    if ((intuitoUso === 'ANALISAR_OUTRAS_PESSOAS' || linkedin.trim()) && !isValidLinkedin(linkedin.trim())) {
      setError('Informe um LinkedIn válido começando com https://.');
      return;
    }

    setLoading(true);
    const result = await register({
      name,
      email,
      password,
      profissao,
      fotoPerfilUrl: fotoPerfilUrl || null,
      linkedin,
      intuitoUso,
      permiteAnalisePorTerceiros
    });
    setLoading(false);

    if (result.ok) {
      navigate(redirectTo);
    } else {
      setError(result.error ?? 'Não foi possível cadastrar.');
    }
  };

  return (
    <Card className="p-8 border-border/80 shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="text-muted-foreground mt-2 text-sm" aria-live="polite">
          {step === 1 ? 'Etapa 1 de 2: dados de acesso' : 'Etapa 2 de 2: seu perfil'}
        </p>
      </div>

      {authMessage && <AuthNotice message={authMessage} />}

      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          {step === 1 && (
            <>
              <Field>
                <FieldLabel htmlFor="name">Nome completo</FieldLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="name"
                    autoComplete="name"
                    required
                    placeholder="Seu nome"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="voce@email.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="confirm">Confirmar senha</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="pl-10"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                <FieldDescription>Use pelo menos 6 caracteres.</FieldDescription>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field>
                <FieldLabel htmlFor="profile-photo">Foto de perfil (opcional)</FieldLabel>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    {fotoPerfilUrl && <AvatarImage src={fotoPerfilUrl} alt="Foto de perfil selecionada" />}
                    <AvatarFallback className="bg-primary/15 text-primary">
                      {initials || <Camera className="h-5 w-5" aria-hidden />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      id="profile-photo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => void handlePhotoChange(event.target.files?.[0])}
                    />
                    <FieldDescription>PNG, JPG ou WebP até 240 KB.</FieldDescription>
                  </div>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="profissao">{intuitoUso === 'CURIOSIDADE' ? 'Profissão (opcional)' : 'Profissão'}</FieldLabel>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="profissao"
                    autoComplete="organization-title"
                    required={intuitoUso === 'ANALISAR_OUTRAS_PESSOAS'}
                    placeholder="Ex.: agrônoma, estudante, pesquisador"
                    className="pl-10"
                    value={profissao}
                    onChange={(e) => setProfissao(e.target.value)}
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="linkedin">{intuitoUso === 'CURIOSIDADE' ? 'LinkedIn (opcional)' : 'LinkedIn'}</FieldLabel>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                  <Input
                    id="linkedin"
                    type="url"
                    autoComplete="url"
                    required={intuitoUso === 'ANALISAR_OUTRAS_PESSOAS'}
                    placeholder="https://www.linkedin.com/in/seu-perfil"
                    className="pl-10"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel>Intuito de uso</FieldLabel>
                <RadioGroup
                  value={intuitoUso}
                  onValueChange={(value) => setIntuitoUso(value as IntuitoUsoAplicacao)}
                  className="gap-2"
                  required
                >
                  <label className="flex items-start gap-3 rounded-md border border-border/80 p-3 text-sm">
                    <RadioGroupItem value="ANALISAR_OUTRAS_PESSOAS" className="mt-1" />
                    <span>
                      <span className="flex items-center gap-2 font-medium">
                        <Users className="h-4 w-4 text-primary" aria-hidden />
                        Ajudar outras pessoas
                      </span>
                      <span className="mt-1 block text-muted-foreground">
                        Quero colaborar analisando resultados enviados por outros usuários.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-md border border-border/80 p-3 text-sm">
                    <RadioGroupItem value="CURIOSIDADE" className="mt-1" />
                    <span>
                      <span className="flex items-center gap-2 font-medium">
                        <Target className="h-4 w-4 text-primary" aria-hidden />
                        Usar por curiosidade
                      </span>
                      <span className="mt-1 block text-muted-foreground">
                        Quero conhecer a aplicação e analisar minhas próprias imagens.
                      </span>
                    </span>
                  </label>
                </RadioGroup>
              </Field>

              <Field>
                <div className="flex items-center justify-between gap-4 rounded-md border border-border/80 p-3">
                  <div>
                    <FieldLabel htmlFor="allow-peer-review">Permitir análise por outras pessoas</FieldLabel>
                    <FieldDescription>
                      Autoriza que outros usuários revisem suas análises.
                    </FieldDescription>
                  </div>
                  <Switch
                    id="allow-peer-review"
                    checked={permiteAnalisePorTerceiros}
                    onCheckedChange={setPermiteAnalisePorTerceiros}
                  />
                </div>
              </Field>
            </>
          )}

          {error && <FieldError role="alert">{error}</FieldError>}

          <div className="flex gap-3">
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="min-h-12"
                disabled={loading}
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
              >
                <ArrowLeft className="w-5 h-5 mr-2" aria-hidden />
                Voltar
              </Button>
            )}
            <Button type="submit" size="lg" className="flex-1 min-h-12" disabled={loading}>
              {step === 1 ? (
                <>
                  Continuar
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden />
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" aria-hidden />
                  {loading ? 'Criando conta...' : 'Cadastrar'}
                </>
              )}
            </Button>
          </div>
        </FieldGroup>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Já tem conta?{' '}
        <Link to="/login" state={authLinkState} className="text-primary font-medium hover:underline">
          Fazer login
        </Link>
      </p>

      <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed lg:hidden">
        Ao cadastrar, você concorda com o uso educacional do protótipo. Suas análises como visitante
        serão salvas no histórico após o cadastro.
      </p>
    </Card>
  );
}
