import React, { useState, useMemo } from 'react';
import { useData } from './DataContext';
import { Trophy, Star, MessageSquare, User as UserIcon, LogOut, Award, Plus, BookOpen, ChevronRight, RefreshCw } from 'lucide-react';

const DashboardStudent = () => {
    const {
        user, logout, activities = [], missions = [], grades = {}, ranking = [],
        messages = [], classes = [], selectedClass, setSelectedClass, joinClass, loading, refreshAll
    } = useData();

    const [tab, setTab] = useState('status');
    const [showJoin, setShowJoin] = useState(false);
    const [joinCode, setJoinCode] = useState('');

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        try {
            await joinClass(joinCode);
            setJoinCode('');
            setShowJoin(false);
            // Alert is already handled inside joinClass or by the feedback UI
        } catch (err) {
            alert(err.message || 'Falha ao entrar na turma');
        }
    };

    const myStats = useMemo(() => {
        if (!user || !ranking) return { xp: 0, level: 1 };
        return ranking.find(r => r.id === user.id) || { xp: 0, level: 1 };
    }, [ranking, user?.id]);

    const isApproved = useMemo(() => {
        if (!selectedClass || !user) return false;
        // Check the status directly from the class object returned by the server
        // If enrollmentStatus is undefined but we have the class, it might be auto-approved
        return selectedClass.enrollmentStatus === 'APPROVED' || selectedClass.enrollmentStatus === undefined;
    }, [user?.id, selectedClass?.id, selectedClass?.enrollmentStatus]);

    const xp = myStats.xp || 0;
    const level = myStats.level || 1;
    const nextLevelXP = Math.pow(level, 2) * 100;
    const currentLevelBaseXP = Math.pow(level - 1, 2) * 100;
    const progressPercent = Math.max(0, Math.min(((xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100, 100)) || 0;

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--primary)', background: 'rgba(255,255,255,0.05)', boxShadow: '0 0 20px rgba(255, 232, 31, 0.3)' }}>
                            {user?.photoUrl ? <img src={user.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={40} style={{ margin: '20px', color: 'var(--text-muted)' }} />}
                        </div>
                        <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--primary)', color: 'black', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                            LVL {level}
                        </div>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                            PlayGame
                        </h2>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.5rem' }}>By Prof. Johnny Braga de Oliveira</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <BookOpen size={14} color="var(--primary)" />
                            <select
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', outline: 'none', fontWeight: '600' }}
                                value={selectedClass?.id || ''}
                                onChange={(e) => {
                                    const id = parseInt(e.target.value);
                                    const found = classes.find(c => c.id === id);
                                    if (found) setSelectedClass(found);
                                }}
                            >
                                <option value="" disabled>Escolher Turma</option>
                                {classes.map(c => <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.name}</option>)}
                                {classes.length === 0 && <option value="">Sem Turmas</option>}
                            </select>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={refreshAll} className="btn glass-card" disabled={loading} style={{ padding: '0.8rem' }}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                    <button onClick={() => setShowJoin(true)} className="btn btn-secondary">
                        <Plus size={18} /> Nova Guilda
                    </button>
                    <button onClick={logout} className="btn glass-card" style={{ padding: '0.8rem' }}>
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {showJoin && (
                <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '3rem', maxWidth: '450px', margin: '0 auto 3rem auto' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Entrar em Nova Turma</h3>
                    <form onSubmit={handleJoin} style={{ display: 'grid', gap: '1.2rem' }}>
                        <input className="input-field" placeholder="Código Secreto (Ex: ABC123)" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} required />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>ENTRAR</button>
                            <button type="button" onClick={() => setShowJoin(false)} className="btn glass-card" style={{ flex: 1 }}>FECHAR</button>
                        </div>
                    </form>
                </div>
            )}

            <nav style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <button onClick={() => setTab('status')} className={`btn ${tab === 'status' ? 'btn-primary' : 'glass-card'}`} style={{ flex: '1', minWidth: '140px' }}><Trophy size={18} /> Meu Status</button>
                <button onClick={() => setTab('messages')} className={`btn ${tab === 'messages' ? 'btn-primary' : 'glass-card'}`} style={{ flex: '1', minWidth: '140px' }}>
                    <MessageSquare size={18} /> Mural {messages.length > 0 && <span className="badge" style={{ background: '#ef4444', height: '8px', width: '8px', padding: '0', marginLeft: '5px' }}></span>}
                </button>
                <button onClick={() => setTab('ranking')} className={`btn ${tab === 'ranking' ? 'btn-primary' : 'glass-card'}`} style={{ flex: '1', minWidth: '140px' }}><Award size={18} /> Rankings</button>
            </nav>

            <main className="glass-card" style={{ padding: '2.5rem', minHeight: '400px' }}>
                {tab === 'status' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="status-ring" style={{ width: '150px', height: '150px', fontSize: '3.5rem', fontWeight: '900', color: 'white' }}>
                                {level}
                            </div>
                            <h3 style={{ marginTop: '2rem', fontSize: '1.8rem' }}>{xp.toLocaleString()} XP</h3>
                            <div style={{ width: '100%', maxWidth: '300px', marginTop: '1.5rem' }}>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontWeight: '600' }}>
                                    {Math.max(0, nextLevelXP - xp).toLocaleString()} XP para avançar
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>Missões da Classe em {selectedClass?.name || '---'}</h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {isApproved ? (
                                    missions.map(mission => (
                                        <div key={mission.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: 'rgba(255,255,255,0.05)', borderLeft: '4px solid var(--primary)' }}>
                                            <div>
                                                <p style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF' }}>{mission.title}</p>
                                                <p style={{ fontSize: '0.85rem', color: '#E0E0E0' }}>{mission.description}</p>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.4rem' }}>Recompensa: {mission.reward} XP</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span className="badge" style={{ background: 'rgba(255, 232, 31, 0.2)', color: 'var(--primary)' }}>
                                                    ATIVA
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : null}

                                <h3 style={{ marginTop: '2rem', marginBottom: '1.5rem', fontSize: '1.4rem' }}>Atividades Avaliadas</h3>
                                {isApproved ? (
                                    activities.map(act => {
                                        const grade = grades[`${user?.id}-${act.id}`];
                                        return (
                                            <div key={act.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: 'rgba(255,255,255,0.03)' }}>
                                                <div>
                                                    <p style={{ fontSize: '1rem', fontWeight: '700' }}>{act.title}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{act.description || 'Missão Escolar'}</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span className="badge" style={{ background: grade !== undefined ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', color: grade !== undefined ? 'var(--success)' : 'var(--text-muted)' }}>
                                                        {grade !== undefined ? `${grade} / ${act.maxScore}` : 'Pendente'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '16px', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
                                        <Award size={40} style={{ marginBottom: '1rem' }} />
                                        <p style={{ fontWeight: '700' }}>Aguardando Aprovação do Mestre</p>
                                        <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Você poderá ver as missões assim que for aprovado.</p>
                                    </div>
                                )}
                                {isApproved && activities.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                                        Nenhuma missão disponível no momento.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'messages' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h3 style={{ marginBottom: '2rem', fontSize: '1.4rem' }}>Mural da Guilda</h3>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {messages.map(m => (
                                <div key={m.id} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.04)', borderLeft: '6px solid var(--primary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.6rem' }}>
                                                {m.from?.name?.charAt(0) || 'M'}
                                            </div>
                                            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{m.from?.name || 'Mestre'}</span>
                                            <span>•</span>
                                            <span>{m.toClass ? `Turma: ${m.toClass.name}` : 'Privado'}</span>
                                        </div>
                                        <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>{m.content}</p>
                                </div>
                            ))}
                            {messages.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                                    <MessageSquare size={40} style={{ marginBottom: '1rem', opacity: '0.3' }} />
                                    <p>O mural está limpo hoje.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'ranking' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.4rem' }}>Hall da Fama - {selectedClass?.name || 'Geral'}</h3>
                            <button className="badge" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>TOP 100</button>
                        </div>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {ranking.map((r, i) => (
                                <div key={r.id} className="glass-card" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1.2rem',
                                    background: r.id === user?.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                                    transform: r.id === user?.id ? 'scale(1.02)' : 'scale(1)',
                                    zIndex: r.id === user?.id ? '1' : '0'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: i === 0 ? 'var(--warning)' : i === 1 ? '#cbd5e1' : i === 2 ? '#92400e' : 'rgba(255,255,255,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '900',
                                            color: i < 3 ? 'black' : 'white',
                                            fontSize: '1.1rem'
                                        }}>
                                            {i + 1}
                                        </div>
                                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', border: r.id === user?.id ? '2px solid var(--primary)' : 'none' }}>
                                            {r.photoUrl ? <img src={r.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={20} style={{ margin: '12px', color: 'var(--text-muted)' }} />}
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{r.name}</span>
                                            {r.id === user?.id && <span style={{ marginLeft: '8px', fontSize: '0.65rem', background: 'var(--primary)', padding: '2px 6px', borderRadius: '4px' }}>VOCÊ</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.2rem' }}>{r.xp?.toLocaleString() || 0}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>XP REAIS</p>
                                        </div>
                                        <ChevronRight size={20} color="var(--text-muted)" />
                                    </div>
                                </div>
                            ))}
                            {ranking.length === 0 && <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Aguardando aventureiros para o ranking.</p>}
                        </div>
                    </div>
                )}
            </main>
            <footer className="footer-credits">
                <p>Desenvolvido pelo Professor Johnny Braga de Oliveira</p>
                <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>© 2026 PlayGame System - All Rights Reserved</p>
            </footer>
        </div>
    );
};

export default DashboardStudent;
