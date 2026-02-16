import React, { useState, useMemo, useEffect } from 'react';
import { useData } from './DataContext';
import { Trophy, Star, MessageSquare, User as UserIcon, LogOut, Award, RefreshCw, Quote, Info, Settings, Camera, Save, BookOpen, CheckCircle, Bell, Lock } from 'lucide-react';

const DashboardStudent = () => {
    const {
        user, logout, ranking, loading, refreshAll, updateStudentProfile, updateStudentPassword, activities, grades, messages
    } = useData();

    const [tab, setTab] = useState('ranking');
    const [showProfileEdit, setShowProfileEdit] = useState(false);

    const [profileData, setProfileData] = useState({
        nome: user?.nome || '',
        foto_url: user?.foto_url || '',
        info: user?.info || ''
    });

    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (user) {
            setProfileData({
                nome: user.nome || '',
                foto_url: user.foto_url || '',
                info: user.info || ''
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await updateStudentProfile(profileData);
            if (newPassword) {
                await updateStudentPassword(newPassword);
                setNewPassword('');
            }
            setShowProfileEdit(false);
            alert('Perfil e login atualizados com sucesso!');
            refreshAll();
        } catch (err) {
            alert('Falha ao atualizar perfil: ' + err.message);
        }
    };

    const myStats = useMemo(() => {
        if (!user || !ranking) return { xp: 0, level: 1 };
        return ranking.find(r => r.id === user.id) || { xp: 0, level: 1, nome: user.nome };
    }, [ranking, user?.id, user?.nome]);

    const xp = myStats.xp || 0;
    const level = myStats.level || 1;
    const nextLevelXP = Math.pow(level, 2) * 100;
    const currentLevelBaseXP = Math.pow(level - 1, 2) * 100;
    const progressPercent = Math.max(0, Math.min(((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100, 100)) || 0;

    const professor = user?.professor;
    const turma = user?.turma;

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div
                        onClick={() => setShowProfileEdit(true)}
                        style={{ position: 'relative', cursor: 'pointer' }}
                    >
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--primary)', background: 'rgba(255,255,255,0.05)' }}>
                            {user?.foto_url ? <img src={user.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={40} style={{ margin: '20px', color: 'var(--text-muted)' }} />}
                        </div>
                        <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--primary)', color: 'black', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                            LVL {level}
                        </div>
                        <div style={{ position: 'absolute', top: '0', right: '0', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '4px' }}>
                            <Settings size={14} color="white" />
                        </div>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', color: 'var(--primary)' }}>
                            PlayGame
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 'bold' }}>Aventureiro: {user?.nome}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mestre: {myStats.professorNome || professor?.nome || 'Carregando...'}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={refreshAll} className="btn glass-card" disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                    <button onClick={logout} className="btn btn-logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {showProfileEdit && (
                <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Camera size={20} /> Configurações de Aventureiro
                    </h3>
                    <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '1.2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem', display: 'block' }}>Nome</label>
                                <input className="input-field" placeholder="Seu Nome" value={profileData.nome} onChange={e => setProfileData({ ...profileData, nome: e.target.value })} required />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem', display: 'block' }}>E-mail (Login)</label>
                                <input className="input-field" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem', display: 'block' }}>URL da Foto</label>
                            <input className="input-field" placeholder="https://..." value={profileData.foto_url} onChange={e => setProfileData({ ...profileData, foto_url: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem', display: 'block' }}>Sobre Você</label>
                            <textarea className="input-field" placeholder="Conte sua história..." value={profileData.info} onChange={e => setProfileData({ ...profileData, info: e.target.value })} style={{ minHeight: '80px' }} />
                        </div>

                        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={16} color="var(--primary)" /> Alterar Senha de Acesso</h4>
                            <input
                                className="input-field"
                                type="password"
                                placeholder="Nova senha (deixe em branco para não alterar)"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Save size={18} /> SALVAR ALTERAÇÕES</button>
                            <button type="button" onClick={() => setShowProfileEdit(false)} className="btn glass-card" style={{ flex: 1 }}>CANCELAR</button>
                        </div>
                    </form>
                </div>
            )}

            {!showProfileEdit && user?.info && (
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '3rem', background: 'rgba(255,255,255,0.02)' }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Minha Jornada</h4>
                    <p style={{ lineHeight: '1.6' }}>{user.info}</p>
                </div>
            )}

            {professor && (
                <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--secondary)', flexShrink: 0 }}>
                        {professor.foto_url ? <img src={professor.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={60} style={{ margin: '30px', color: 'var(--text-muted)' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Mestre {professor.nome}</h3>
                        {professor.mensagem_incentivo && (
                            <div style={{ fontStyle: 'italic', color: 'var(--primary)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <Quote size={20} /> {professor.mensagem_incentivo}
                            </div>
                        )}
                        {professor.bio && <p style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: '1.5' }}>{professor.bio}</p>}
                    </div>
                </div>
            )}

            {turma?.observacao && (
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '3rem', background: 'rgba(99, 102, 241, 0.1)', borderLeft: '4px solid var(--primary)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Info size={18} /> Nota da Turma</h4>
                    <p style={{ fontSize: '0.95rem' }}>{turma.observacao}</p>
                </div>
            )}

            <nav style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setTab('ranking')} className={`btn ${tab === 'ranking' ? 'btn-active' : ''}`} style={{ flex: 1 }}><Award size={18} /> Hall da Fama</button>
                <button onClick={() => setTab('atividades')} className={`btn ${tab === 'atividades' ? 'btn-active' : ''}`} style={{ flex: 1 }}><BookOpen size={18} /> Minhas Notas</button>
                <button onClick={() => setTab('mensagens')} className={`btn ${tab === 'mensagens' ? 'btn-active' : ''}`} style={{ flex: 1, position: 'relative' }}>
                    <Bell size={18} /> {messages.length > 0 && <span style={{ position: 'absolute', top: '-5px', right: '5px', background: 'var(--danger)', color: 'white', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '10px' }}>{messages.length}</span>} Murais de Recados
                </button>
                <button onClick={() => setTab('status')} className={`btn ${tab === 'status' ? 'btn-active' : ''}`} style={{ flex: 1 }}><Trophy size={18} /> Meu Status</button>
            </nav>

            <main className="glass-card" style={{ padding: '2.5rem' }}>
                {tab === 'status' && (
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="status-ring" style={{ width: '150px', height: '150px', fontSize: '3.5rem', fontWeight: '900' }}>
                            {level}
                        </div>
                        <h3 style={{ marginTop: '2rem', fontSize: '1.8rem' }}>{xp.toLocaleString()} XP</h3>
                        <div style={{ width: '100%', maxWidth: '400px', marginTop: '1.5rem' }}>
                            <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                                Faltam {Math.max(0, nextLevelXP - xp).toLocaleString()} XP para o próximo nível
                            </p>
                        </div>
                    </div>
                )}

                {tab === 'atividades' && (
                    <div>
                        <h3 style={{ marginBottom: '2rem' }}>Minhas Atividades e Avaliações</h3>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {activities.map(activity => {
                                const myGrade = grades.find(g => g.atividadeId === activity.id);
                                return (
                                    <div key={activity.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>{activity.titulo}</h4>
                                            <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>{activity.descricao || 'Sem descrição.'}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            {myGrade ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                                                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--secondary)' }}>{myGrade.valor} / {activity.nota_maxima}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 'bold' }}>+ {myGrade.valor * 10} XP GANHOS</span>
                                                </div>
                                            ) : (
                                                <div style={{ opacity: 0.4, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <RefreshCw size={16} />
                                                    <span>Aguardando Avaliação</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {activities.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                    <BookOpen size size={40} style={{ marginBottom: '1rem' }} />
                                    <p>Nenhuma atividade lançada para sua turma ainda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'mensagens' && (
                    <div>
                        <h3 style={{ marginBottom: '2rem' }}>Mural de Avisos da Guilda</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {messages.map(m => (
                                <div key={m.id} className="glass-card" style={{
                                    padding: '1.5rem',
                                    background: m.alunoId ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 232, 31, 0.05)',
                                    borderLeft: m.alunoId ? '4px solid var(--secondary)' : '4px solid var(--primary)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: m.alunoId ? 'var(--secondary)' : 'var(--primary)' }}>
                                            {m.alunoId ? '👤 MENSAGEM INDIVIDUAL' : '📣 AVISO GERAL'}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(m.data_criacao).toLocaleString()}</span>
                                    </div>
                                    <p style={{ lineHeight: '1.6', margin: 0, fontSize: '1.05rem' }}>{m.conteudo}</p>
                                    <div style={{ marginTop: '0.8rem', textAlign: 'right', fontSize: '0.75rem', opacity: 0.6 }}>
                                        — {m.professor?.nome || 'Seu Mestre'}
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                    <MessageSquare size={40} style={{ marginBottom: '1rem' }} />
                                    <p>Nenhum recado no mural ainda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'ranking' && (
                    <div>
                        <h3 style={{ marginBottom: '2rem' }}>Hall da Fama (Líderes da Guilda)</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '1rem' }}>RANK</th>
                                        <th style={{ padding: '1rem' }}>AVENTUREIRO</th>
                                        <th style={{ padding: '1rem' }}>MESTRE RESPONSÁVEL</th>
                                        <th style={{ padding: '1rem' }}>XP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranking.map((r, i) => (
                                        <tr key={r.id} style={{
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            background: r.id === user?.id ? 'rgba(255, 232, 31, 0.05)' : 'transparent'
                                        }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{i + 1}º</td>
                                            <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
                                                    {r.foto_url ? <img src={r.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={14} style={{ margin: '8px' }} />}
                                                </div>
                                                <span style={{ fontWeight: r.id === user?.id ? '900' : 'normal' }}>
                                                    {r.nome} {r.id === user?.id && '(VOCÊ)'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{r.professorNome}</td>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{r.xp}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            <footer style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                <p>Desenvolvido pelo Professor Johnny Oliveira</p>
            </footer>
        </div>
    );
};

export default DashboardStudent;
