import React, { useState } from 'react';
import { useData } from './DataContext';
import { LogIn, UserPlus, Mail, Lock, User, Code, ArrowLeft, Camera } from 'lucide-react';

const Login = () => {
    const { login, registerStudent } = useData();
    const [view, setView] = useState('login'); // 'login', 'register'
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        joinCode: '',
        photoUrl: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (view === 'login') {
                await login(formData.username, formData.password);
            } else {
                await registerStudent(formData);
                alert('Cadastro realizado com sucesso! Bem-vindo à guilda.');
            }
        } catch (e) {
            alert(e.message);
        }
    };

    const handlePhoto = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => setFormData({ ...formData, photoUrl: reader.result });
        if (file) reader.readAsDataURL(file);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
            <div className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: '450px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        EduGame
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>{view === 'login' ? 'Entre na sua Guilda' : 'Novo Aluno: Criar Perfil'}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {view === 'register' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px dashed var(--glass-border)', overflow: 'hidden' }}>
                                {formData.photoUrl ? <img src={formData.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={24} style={{ margin: '28px', color: 'var(--text-muted)' }} />}
                                <input type="file" hidden id="avatar" accept="image/*" onChange={handlePhoto} />
                                <label htmlFor="avatar" style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}></label>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Subir Foto (Opcional)</span>
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {view === 'register' && (
                            <>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><User size={14} /> Nome Completo</label>
                                    <input className="input-field" placeholder="Ex: João Silva" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><Code size={14} /> Código da Turma</label>
                                    <input className="input-field" placeholder="Fornecido pelo professor" value={formData.joinCode} onChange={e => setFormData({ ...formData, joinCode: e.target.value.toUpperCase() })} required />
                                </div>
                            </>
                        )}

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><Mail size={14} /> Usuário / E-mail</label>
                            <input className="input-field" placeholder="Seu nome de usuário" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><Lock size={14} /> Senha</label>
                            <input className="input-field" type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '1rem' }}>
                        {view === 'login' ? 'ENTRAR' : 'CONCLUIR CADASTRO'} {view === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    {view === 'login' ? (
                        <button className="btn" style={{ width: '100%', justifyContent: 'center', background: 'transparent', fontSize: '0.85rem' }} onClick={() => setView('register')}>
                            Não tem conta? <span style={{ color: 'var(--secondary)', marginLeft: '4px' }}>Cadastrar como Aluno</span>
                        </button>
                    ) : (
                        <button className="btn" style={{ width: '100%', justifyContent: 'center', background: 'transparent', fontSize: '0.85rem' }} onClick={() => setView('login')}>
                            <ArrowLeft size={16} /> Voltar para Login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
