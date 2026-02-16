import React, { useState } from 'react';
import { useData } from './DataContext';
import { LogIn, UserPlus, Mail, Lock, User, Code, ArrowLeft, Shield } from 'lucide-react';

const Login = () => {
    const { login, registerStudent, updateProfessorPassword } = useData();
    const [role, setRole] = useState('ALUNO'); // 'ALUNO', 'PROFESSOR', 'ADMIN'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nome: '',
        codigo: ''
    });

    const [newPassword, setNewPassword] = useState('');
    const [mustChange, setMustChange] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (mustChange) {
                await updateProfessorPassword(newPassword);
                alert('Senha alterada com sucesso! Você já está conectado.');
                setMustChange(false);
                return;
            }

            let credentials = {};
            if (role === 'ALUNO') {
                credentials = { nome: formData.nome, codigo: formData.codigo };
            } else {
                credentials = { email: formData.email, password: formData.password };
            }

            const user = await login(credentials);

            if (user && user.role === 'PROFESSOR' && user.primeiro_acesso) {
                setMustChange(true);
            }
        } catch (e) {
            alert(e.message || 'Erro ao realizar login');
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem', background: 'var(--bg-dark)' }}>
            <div className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: '450px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--primary)', textShadow: '0 0 10px rgba(255, 232, 31, 0.3)', fontWeight: '900' }}>
                        RANKING SENAI
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {mustChange ? 'Alteração de Senha Obrigatória' : 'Acesse sua conta para ver o Ranking'}
                    </p>
                </div>

                {!mustChange && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        {['ALUNO', 'PROFESSOR', 'ADMIN'].map(r => (
                            <button
                                key={r}
                                onClick={() => setRole(r)}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                    background: role === r ? 'var(--primary)' : 'transparent',
                                    color: role === r ? '#000' : 'var(--text-muted)',
                                    fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {mustChange ? (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px' }}>
                                <p style={{ color: 'var(--warning)', fontWeight: 'bold' }}>Segurança em Primeiro Lugar!</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mestres devem trocar a senha no primeiro acesso.</p>
                            </div>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><Lock size={14} /> Nova Senha</label>
                                <input
                                    className="input-field"
                                    type="password"
                                    placeholder="Sua nova senha secreta"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '1rem' }}>
                                SALVAR E CONTINUAR
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1.2rem' }}>
                            {role === 'ALUNO' ? (
                                <>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><User size={14} /> Seu Nome</label>
                                        <input
                                            className="input-field"
                                            placeholder="Ex: João da Silva"
                                            value={formData.nome}
                                            onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><Code size={14} /> Código da Turma</label>
                                        <input
                                            className="input-field"
                                            placeholder="Código do seu professor"
                                            value={formData.codigo}
                                            onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                                            required
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><Mail size={14} /> E-mail</label>
                                        <input
                                            className="input-field"
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><Lock size={14} /> Senha</label>
                                        <input
                                            className="input-field"
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '1rem', gap: '0.5rem' }}>
                                {role === 'ALUNO' ? 'ENTRAR NO RANKING' : 'ACESSAR PAINEL'}
                                <LogIn size={18} />
                            </button>
                        </div>
                    )}
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        Desenvolvido por <strong>Johnny Oliveira</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
