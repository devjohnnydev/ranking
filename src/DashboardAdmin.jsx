import React, { useState, useEffect } from 'react';
import { useData } from './DataContext';
import { Trophy, Users, Star, Plus, Send, LogOut, Award, BookOpen, RefreshCw, Key, Image as ImageIcon, UserCircle, CheckCircle } from 'lucide-react';

const DashboardAdmin = () => {
    const {
        logout, user, classes, selectedClass, setSelectedClass,
        addActivity, setStudentGrade, ranking, refreshAll, loading,
        createClass, updateProfile, activities, students
    } = useData();

    const [tab, setTab] = useState('ranking');
    const [showNewClass, setShowNewClass] = useState(false);
    const [showProfileEdit, setShowProfileEdit] = useState(false);

    const [newTurma, setNewTurma] = useState({ nome: '', materia: '', observacao: '' });
    const [newActivity, setNewActivity] = useState({ titulo: '', descricao: '', nota_maxima: 10 });
    const [profileData, setProfileData] = useState({
        foto_url: user?.foto_url || '',
        bio: user?.bio || '',
        mensagem_incentivo: user?.mensagem_incentivo || ''
    });

    const [selectedActivity, setSelectedActivity] = useState(null);
    const [editGrades, setEditGrades] = useState({});

    useEffect(() => {
        if (user) {
            setProfileData({
                foto_url: user.foto_url || '',
                bio: user.bio || '',
                mensagem_incentivo: user.mensagem_incentivo || ''
            });
        }
    }, [user]);

    const handleCreateTurma = async (e) => {
        e.preventDefault();
        try {
            await createClass(newTurma.nome, newTurma.materia, newTurma.observacao);
            setNewTurma({ nome: '', materia: '', observacao: '' });
            setShowNewClass(false);
            alert('Turma criada com sucesso!');
        } catch (err) {
            alert('Falha ao criar turma: ' + err.message);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(profileData);
            setShowProfileEdit(false);
            alert('Perfil atualizado!');
        } catch (err) {
            alert('Falha ao atualizar perfil');
        }
    };

    const handleAddActivity = async (e) => {
        e.preventDefault();
        if (!selectedClass) return alert('Selecione uma turma primeiro');
        try {
            await addActivity(newActivity);
            setNewActivity({ titulo: '', descricao: '', nota_maxima: 10 });
            alert('Atividade lançada com sucesso!');
        } catch (err) {
            alert('Falha ao lançar atividade');
        }
    };

    const handleSetGrade = async (studentId, activityId) => {
        const value = editGrades[`${studentId}-${activityId}`];
        if (value === undefined || value === '') return;
        try {
            await setStudentGrade(studentId, activityId, value);
            alert('Nota salva!');
        } catch (err) {
            alert('Erro ao salvar nota');
        }
    };

    const filteredStudents = students.filter(s => !selectedClass || s.turmaId === selectedClass.id);
    const filteredActivities = activities.filter(a => !selectedClass || a.turmaId === selectedClass.id);

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div
                        onClick={() => setShowProfileEdit(true)}
                        style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--primary)', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
                    >
                        {user?.foto_url ? <img src={user.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle size={40} style={{ margin: '20px', color: 'var(--text-muted)' }} />}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>RANKING SENAI</h1>
                        <h2 style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>Mestre {user?.nome}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                            <div className="glass-card" style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <BookOpen size={16} color="var(--primary)" />
                                <select
                                    style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
                                    value={selectedClass?.id || ''}
                                    onChange={(e) => {
                                        const id = parseInt(e.target.value);
                                        const found = classes.find(c => c.id === id);
                                        if (found) setSelectedClass(found);
                                    }}
                                >
                                    <option value="" disabled>Selecionar Turma</option>
                                    {classes.map(c => <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.nome}</option>)}
                                </select>
                            </div>
                            <button onClick={() => setShowNewClass(true)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                                <Plus size={16} /> NOVA TURMA
                            </button>
                        </div>
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
                    <h3 style={{ marginBottom: '1.5rem' }}>Editar Perfil do Mestre</h3>
                    <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '1.2rem' }}>
                        <input className="input-field" placeholder="URL da Foto" value={profileData.foto_url} onChange={e => setProfileData({ ...profileData, foto_url: e.target.value })} />
                        <textarea className="input-field" placeholder="Sua Bio / História" value={profileData.bio} onChange={e => setProfileData({ ...profileData, bio: e.target.value })} style={{ minHeight: '100px' }} />
                        <input className="input-field" placeholder="Mensagem de Incentivo" value={profileData.mensagem_incentivo} onChange={e => setProfileData({ ...profileData, mensagem_incentivo: e.target.value })} />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>SALVAR PERFIL</button>
                            <button type="button" onClick={() => setShowProfileEdit(false)} className="btn glass-card" style={{ flex: 1 }}>CANCELAR</button>
                        </div>
                    </form>
                </div>
            )}

            {showNewClass && (
                <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem', maxWidth: '500px', margin: '0 auto 3rem auto' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Criar Nova Turma</h3>
                    <form onSubmit={handleCreateTurma} style={{ display: 'grid', gap: '1.2rem' }}>
                        <input className="input-field" placeholder="Nome da Turma" value={newTurma.nome} onChange={e => setNewTurma({ ...newTurma, nome: e.target.value })} required />
                        <input className="input-field" placeholder="Matéria" value={newTurma.materia} onChange={e => setNewTurma({ ...newTurma, materia: e.target.value })} />
                        <textarea className="input-field" placeholder="Observações da Turma" value={newTurma.observacao} onChange={e => setNewTurma({ ...newTurma, observacao: e.target.value })} />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>CRIAR TURMA</button>
                            <button type="button" onClick={() => setShowNewClass(false)} className="btn glass-card" style={{ flex: 1 }}>CANCELAR</button>
                        </div>
                    </form>
                </div>
            )}

            {selectedClass && (
                <div className="glass-card" style={{ padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--secondary)' }}>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>CÓDIGO DE ACESSO</p>
                        <h2 style={{ letterSpacing: '2px', color: 'var(--warning)' }}>{selectedClass.codigo}</h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h3 style={{ margin: 0 }}>{selectedClass.nome}</h3>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>{selectedClass.materia}</p>
                    </div>
                </div>
            )}

            <nav style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                <button onClick={() => setTab('ranking')} className={`btn ${tab === 'ranking' ? 'btn-active' : ''}`}><Trophy size={18} /> Ranking</button>
                <button onClick={() => setTab('atividades')} className={`btn ${tab === 'atividades' ? 'btn-active' : ''}`}><Plus size={18} /> Atividades/Notas</button>
            </nav>

            <main className="glass-card" style={{ padding: '2.5rem' }}>
                {tab === 'ranking' && (
                    <div>
                        <h3 style={{ marginBottom: '2rem' }}>Classificação da Turma</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1rem' }}>POS</th>
                                    <th style={{ padding: '1rem' }}>ALUNO</th>
                                    <th style={{ padding: '1rem' }}>XP TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.filter(r => !selectedClass || r.turmaNome === selectedClass.nome).map((s, idx) => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{idx + 1}º</td>
                                        <td style={{ padding: '1rem' }}>{s.nome}</td>
                                        <td style={{ padding: '1rem', color: 'var(--secondary)', fontWeight: 'bold' }}>{s.xp} XP</td>
                                    </tr>
                                ))}
                                {ranking.length === 0 && <tr><td colSpan="3" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aguardando registro de XP...</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'atividades' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '2rem' }}>
                        <div>
                            <button onClick={() => setSelectedActivity('new')} className="btn btn-secondary" style={{ width: '100%', marginBottom: '1.5rem' }}>
                                <Plus size={18} /> NOVA ATIVIDADE
                            </button>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {filteredActivities.map(a => (
                                    <div
                                        key={a.id}
                                        onClick={() => setSelectedActivity(a)}
                                        className={`glass-card ${selectedActivity?.id === a.id ? 'btn-active' : ''}`}
                                        style={{ padding: '1rem', cursor: 'pointer', transition: '0.2s' }}
                                    >
                                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{a.titulo}</h4>
                                        <p style={{ fontSize: '0.7rem', opacity: 0.6, margin: '0.2rem 0 0 0' }}>{new Date(a.data_criacao).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '2rem', background: 'rgba(255, 255, 255, 0.02)' }}>
                            {selectedActivity === 'new' ? (
                                <div>
                                    <h3 style={{ marginBottom: '1.5rem' }}>Lançar Novo Item de Avaliação</h3>
                                    <form onSubmit={handleAddActivity} style={{ display: 'grid', gap: '1.2rem' }}>
                                        <input className="input-field" placeholder="Título da Atividade" value={newActivity.titulo} onChange={e => setNewActivity({ ...newActivity, titulo: e.target.value })} required />
                                        <textarea className="input-field" placeholder="Descrição (Opcional)" value={newActivity.descricao} onChange={e => setNewActivity({ ...newActivity, descricao: e.target.value })} />
                                        <input className="input-field" type="number" placeholder="Nota Máxima (Ex: 10)" value={newActivity.nota_maxima} onChange={e => setNewActivity({ ...newActivity, nota_maxima: e.target.value })} required />
                                        <button type="submit" className="btn btn-primary">CRIAR ITEM</button>
                                    </form>
                                </div>
                            ) : selectedActivity ? (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3 style={{ margin: 0 }}>Avaliando: {selectedActivity.titulo}</h3>
                                        <span className="glass-card" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', color: 'var(--primary)' }}>Máximo: {selectedActivity.nota_maxima} pts</span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '2rem' }}>{selectedActivity.descricao || 'Sem descrição.'}</p>

                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                                                <th style={{ padding: '0.8rem' }}>ALUNO</th>
                                                <th style={{ padding: '0.8rem' }}>LANÇAR NOTA</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map(student => {
                                                const existingGrade = selectedActivity.notas?.find(n => n.alunoId === student.id)?.valor;
                                                return (
                                                    <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <td style={{ padding: '0.8rem' }}>{student.nome}</td>
                                                        <td style={{ padding: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                            <input
                                                                className="input-field"
                                                                type="number"
                                                                style={{ width: '80px', padding: '0.5rem' }}
                                                                placeholder={existingGrade !== undefined ? existingGrade.toString() : 'Nota'}
                                                                value={editGrades[`${student.id}-${selectedActivity.id}`] ?? ''}
                                                                onChange={e => setEditGrades({ ...editGrades, [`${student.id}-${selectedActivity.id}`]: e.target.value })}
                                                            />
                                                            <button
                                                                onClick={() => handleSetGrade(student.id, selectedActivity.id)}
                                                                className="btn btn-primary"
                                                                style={{ padding: '0.5rem' }}
                                                            >
                                                                <CheckCircle size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                    <Star size={40} style={{ marginBottom: '1rem' }} />
                                    <p>Selecione uma atividade para avaliar ou crie uma nova.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardAdmin;
