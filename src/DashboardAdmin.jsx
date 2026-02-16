import React, { useState } from 'react';
import { useData } from './DataContext';
import { Trophy, Users, Star, Plus, Send, LogOut, Award, ChevronRight, BookOpen, Clock, Check, X, MessageSquare, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

const StudentGradeRow = ({ student, activities, grades, onSaveGrade }) => {
    const [localGrades, setLocalGrades] = useState({});
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const promises = Object.entries(localGrades).map(([actId, score]) =>
                onSaveGrade(student.id, parseInt(actId), score)
            );
            await Promise.all(promises);
            setLocalGrades({});
            alert(`Notas de ${student.name} salvas!`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <tr key={student.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{student.name}</td>
            {activities.map(a => (
                <td key={a.id} style={{ padding: '1rem', textAlign: 'center' }}>
                    <input
                        type="number"
                        className="input-field"
                        style={{ width: '70px', textAlign: 'center', padding: '0.4rem' }}
                        value={localGrades[a.id] !== undefined ? localGrades[a.id] : (grades[`${student.id}-${a.id}`] || '')}
                        onChange={(e) => setLocalGrades({ ...localGrades, [a.id]: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                    />
                </td>
            ))}
            <td style={{ padding: '1rem', textAlign: 'center' }}>
                <button
                    className={`btn ${Object.keys(localGrades).length > 0 ? 'btn-primary' : 'glass-card'}`}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    disabled={Object.keys(localGrades).length === 0 || saving}
                    onClick={handleSave}
                >
                    {saving ? '...' : 'SALVAR'}
                </button>
            </td>
        </tr>
    );
};

const DashboardAdmin = () => {
    const {
        logout, user, students = [], activities = [], missions = [],
        addActivity, addMission, setStudentGrade, grades = {}, ranking = [],
        classes = [], selectedClass, setSelectedClass, createClass, sendMessage,
        pendingEnrollments = [], approveEnrollment, refreshAll, loading, updateProfile
    } = useData();

    const [tab, setTab] = useState('ranking');
    const [showNewClass, setShowNewClass] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassSubject, setNewClassSubject] = useState('');
    const [newActivity, setNewActivity] = useState({ title: '', description: '', maxScore: 10 });
    const [newMission, setNewMission] = useState({ title: '', description: '', reward: 100 });
    const [msgContent, setMsgContent] = useState('');

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            await createClass(newClassName, newClassSubject);
            setNewClassName('');
            setNewClassSubject('');
            setShowNewClass(false);
        } catch (err) {
            alert('Falha ao criar turma');
        }
    };

    const handleAddActivity = async (e) => {
        e.preventDefault();
        if (!selectedClass) return alert('Selecione uma turma primeiro');
        try {
            await addActivity({ ...newActivity, classId: selectedClass.id });
            setNewActivity({ title: '', description: '', maxScore: 10 });
            alert('Atividade lançada com sucesso!');
        } catch (err) {
            alert('Falha ao lançar atividade');
        }
    };

    const handleAddMission = async (e) => {
        e.preventDefault();
        if (!selectedClass) return alert('Selecione uma turma primeiro');
        try {
            await addMission({ ...newMission, classId: selectedClass.id });
            setNewMission({ title: '', description: '', reward: 100 });
            alert('Missão de classe lançada com sucesso!');
        } catch (err) {
            alert('Falha ao lançar missão');
        }
    };

    const sendClassMessage = async () => {
        if (!msgContent.trim() || !selectedClass) return;
        try {
            await sendMessage({ toClassId: selectedClass.id, content: msgContent });
            setMsgContent('');
            alert('Mensagem enviada com sucesso!');
        } catch (err) {
            alert('Falha ao enviar comunicado');
        }
    };

    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        bio: user?.bio || '',
        quote: user?.quote || '',
        photoUrl: user?.photoUrl || ''
    });

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(profileData);
            setShowProfileEdit(false);
            alert('Perfil atualizado com sucesso!');
        } catch (err) {
            alert('Erro ao atualizar perfil');
        }
    };

    const handleDeleteClass = async () => {
        if (!selectedClass) return;
        if (!confirm(`TEM CERTEZA? Isso apagará a turma "${selectedClass.name}", todos os alunos, notas e atividades PERMANENTEMENTE.`)) return;
        
        try {
            const res = await fetch(`/api/classes/${selectedClass.id}?teacherId=${user.id}&username=${user.username}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                alert('Turma encerrada e apagada com sucesso!');
                setSelectedClass(null);
                refreshAll();
            } else {
                const data = await res.json();
                alert('Erro: ' + (data.error || 'Falha ao apagar turma'));
            }
        } catch (err) {
            alert('Erro de conexão ao apagar turma');
        }
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div 
                        onClick={() => setShowProfileEdit(true)}
                        style={{ position: 'relative', cursor: 'pointer' }}
                    >
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--primary)', background: 'rgba(255,255,255,0.05)', boxShadow: '0 0 20px rgba(255, 232, 31, 0.3)' }}>
                            {user?.photoUrl ? <img src={user.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={40} style={{ margin: '20px', color: 'var(--text-muted)' }} />}
                        </div>
                        <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--primary)', color: 'black', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                            EDIT
                        </div>
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>PlayGame</h1>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>By Prof. Johnny Braga de Oliveira</p>
                        <h2 style={{ fontSize: '1.2rem', color: 'var(--secondary)', marginTop: '0.5rem' }}>Mestre {user?.name || user?.username}</h2>
                        {user?.quote && <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--primary)', marginTop: '0.2rem' }}>"{user.quote}"</p>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.8rem' }}>
                            <div className="glass-card" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <BookOpen size={18} color="var(--primary)" />
                                <select
                                    style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
                                    value={selectedClass?.id || ''}
                                    onChange={(e) => {
                                        const id = parseInt(e.target.value);
                                        const found = classes.find(c => c.id === id);
                                        if (found) setSelectedClass(found);
                                    }}
                                >
                                    <option value="" disabled>Selecione uma turma</option>
                                    {classes.map(c => <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.name} - {c.subject}</option>)}
                                    {classes.length === 0 && <option value="">Nenhuma turma disponível</option>}
                                </select>
                            </div>
                            <button onClick={() => setShowNewClass(true)} className="btn btn-secondary" style={{ height: '42px' }}>
                                <Plus size={18} /> Turma
                            </button>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={refreshAll} className="btn glass-card" disabled={loading} style={{ padding: '0.8rem' }}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                    <button onClick={logout} className="btn btn-logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {showProfileEdit && (
                <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Editar Perfil do Mestre</h3>
                    <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '1.2rem' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Nome Público</label>
                            <input className="input-field" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>URL da Foto (Avatar)</label>
                            <input className="input-field" value={profileData.photoUrl} onChange={e => setProfileData({ ...profileData, photoUrl: e.target.value })} placeholder="https://..." />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Frase de Efeito (Quote)</label>
                            <input className="input-field" value={profileData.quote} onChange={e => setProfileData({ ...profileData, quote: e.target.value })} placeholder="Uma frase inspiradora..." />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Bio / História</label>
                            <textarea className="input-field" value={profileData.bio} onChange={e => setProfileData({ ...profileData, bio: e.target.value })} style={{ minHeight: '100px' }} placeholder="Conte um pouco sobre sua jornada..." />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>SALVAR PERFIL</button>
                            <button type="button" onClick={() => setShowProfileEdit(false)} className="btn glass-card" style={{ flex: 1 }}>CANCELAR</button>
                        </div>
                    </form>
                </div>
            )}

            {showNewClass && (
                <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '3rem', maxWidth: '500px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Nova Aventura (Turma)</h3>
                    <form onSubmit={handleCreateClass} style={{ display: 'grid', gap: '1.2rem' }}>
                        <input className="input-field" placeholder="Nome da Turma" value={newClassName} onChange={e => setNewClassName(e.target.value)} required />
                        <input className="input-field" placeholder="Matéria Principal" value={newClassSubject} onChange={e => setNewClassSubject(e.target.value)} required />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>CRIAR</button>
                            <button type="button" onClick={() => setShowNewClass(false)} className="btn glass-card" style={{ flex: 1 }}>VOLTAR</button>
                        </div>
                    </form>
                </div>
            )}

            {selectedClass && (
                <div className="glass-card" style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.05))',
                    padding: '1.5rem 2rem',
                    marginBottom: '3rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: '4px solid var(--primary)'
                }}>
                    <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>CÓDIGO DE ENTRADA</span>
                        <h2 style={{ letterSpacing: '4px', color: 'var(--secondary)', fontSize: '2rem', margin: '0.2rem 0' }}>{selectedClass.joinCode}</h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: '800', fontSize: '1.2rem' }}>{selectedClass.name}</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedClass.subject}</p>
                        <button 
                            onClick={handleDeleteClass}
                            className="btn"
                            style={{ 
                                marginTop: '0.5rem', 
                                padding: '0.4rem 0.8rem', 
                                fontSize: '0.7rem', 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}
                        >
                            ENCERRAR SEMESTRE (APAGAR)
                        </button>
                    </div>
                </div>
            )}

            <nav style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem', flexWrap: 'nowrap' }}>
                <button onClick={() => setTab('ranking')} className={`btn ${tab === 'ranking' ? 'btn-active' : ''}`} style={{ flex: '1', minWidth: '140px' }}><Trophy size={18} /> Ranking</button>
                <button onClick={() => setTab('students')} className={`btn ${tab === 'students' ? 'btn-active' : ''}`} style={{ flex: '1', minWidth: '140px' }}><Users size={18} /> Alunos</button>
                <button onClick={() => setTab('missions')} className={`btn ${tab === 'missions' ? 'btn-active' : ''}`} style={{ flex: '1', minWidth: '140px' }}><Plus size={18} /> Missões</button>
                <button onClick={() => setTab('grades')} className={`btn ${tab === 'grades' ? 'btn-active' : ''}`} style={{ flex: '1', minWidth: '140px' }}><Award size={18} /> Avaliação</button>
                <button onClick={() => setTab('messages')} className={`btn ${tab === 'messages' ? 'btn-active' : ''}`} style={{ flex: '1', minWidth: '140px' }}><Send size={18} /> Mensagens</button>
            </nav>

            <main className="glass-card" style={{ padding: '2.5rem' }}>
                {tab === 'ranking' && (
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <h3 style={{ marginBottom: '2rem' }}>Classificação da Turma: {selectedClass?.name || 'Selecione uma turma'}</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <th style={{ padding: '0 1rem' }}>RANK</th>
                                        <th style={{ padding: '0 1rem' }}>AVENTUREIRO</th>
                                        <th style={{ padding: '0 1rem' }}>NÍVEL</th>
                                        <th style={{ padding: '0 1rem' }}>XP TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranking.map((s, idx) => (
                                        <tr key={s.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                            <td style={{ padding: '1rem', fontWeight: '900', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                                {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `${idx + 1}º`}
                                            </td>
                                            <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)' }}>
                                                    {s.photoUrl ? <img src={s.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={18} style={{ margin: '9px' }} />}
                                                </div>
                                                <span style={{ fontWeight: '700' }}>{s.name}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>LVL {s.level || 1}</span>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--secondary)', fontWeight: '900', fontSize: '1.2rem', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                                {s.xp?.toLocaleString() || 0}
                                            </td>
                                        </tr>
                                    ))}
                                    {ranking.length === 0 && <tr><td colSpan="4" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aguardando registro de XP...</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'students' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ margin: 0 }}>Alunos Matriculados ({students.length})</h3>
                            {pendingEnrollments.length > 0 && (
                                <span className="badge" style={{ background: 'var(--warning)', color: 'black' }}>
                                    {pendingEnrollments.length} PENDENTES
                                </span>
                            )}
                        </div>

                        {pendingEnrollments.length > 0 && (
                            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                <h4 style={{ marginBottom: '1rem', color: 'var(--warning)' }}>Aprovações Pendentes</h4>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {pendingEnrollments.map(e => (
                                        <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)' }}>
                                                    {e.student.photoUrl ? <img src={e.student.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} style={{ margin: '10px' }} />}
                                                </div>
                                                <span style={{ fontWeight: '700' }}>{e.student.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => approveEnrollment(e.id, 'APPROVED')} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>APROVAR</button>
                                                <button onClick={() => approveEnrollment(e.id, 'REJECTED')} className="btn glass-card" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#ef4444' }}>RECUSAR</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                            {students.map(s => (
                                <div key={s.id} className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)' }}>
                                            {s.photoUrl ? <img src={s.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} style={{ margin: '12px' }} />}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '800', fontSize: '0.95rem' }}>{s.name}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--success)' }}>Ativo</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            if(confirm(`Remover ${s.name} da turma?`)) {
                                                try {
                                                    const res = await fetch(`/api/enrollments/remove?studentId=${s.id}&classId=${selectedClass.id}`, { method: 'DELETE' });
                                                    if (res.ok) {
                                                        alert('Aluno removido');
                                                        refreshAll();
                                                    }
                                                } catch (e) {
                                                    alert('Erro ao remover');
                                                }
                                            }
                                        }}
                                        className="btn" 
                                        style={{ padding: '0.4rem', color: '#ef4444' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            {students.length === 0 && pendingEnrollments.length === 0 && <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>Nenhum aluno entrou na turma ainda.</p>}
                        </div>
                    </div>
                )}

                {tab === 'missions' && (
                    <div>
                        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', background: 'rgba(255, 232, 31, 0.1)' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                                <Plus size={24} /> Nova Missão de Classe (XP p/ Todos)
                            </h3>
                            <form onSubmit={handleAddMission} style={{ display: 'grid', gap: '1.2rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Título da Missão</label>
                                    <input className="input-field" value={newMission.title} onChange={e => setNewMission({ ...newMission, title: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Descrição da Missão</label>
                                    <textarea className="input-field" value={newMission.description} onChange={e => setNewMission({ ...newMission, description: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Recompensa em XP</label>
                                    <input type="number" className="input-field" value={newMission.reward} onChange={e => setNewMission({ ...newMission, reward: parseInt(e.target.value) || 0 })} required />
                                </div>
                                <button type="submit" className="btn btn-primary">LANÇAR MISSÃO PARA A TURMA</button>
                            </form>
                        </div>

                        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', background: 'rgba(99, 102, 241, 0.05)' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={24} color="var(--primary)" /> Novo Item de Avaliação (Individual)
                            </h3>
                            <form onSubmit={handleAddActivity} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) 2fr 100px 150px', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Título</label>
                                    <input className="input-field" value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Descrição (Opcional)</label>
                                    <input className="input-field" value={newActivity.description} onChange={e => setNewActivity({ ...newActivity, description: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Pontos</label>
                                    <input type="number" className="input-field" value={newActivity.maxScore} onChange={e => setNewActivity({ ...newActivity, maxScore: parseFloat(e.target.value) || 0 })} required />
                                </div>
                                <button type="submit" className="btn btn-primary">CRIAR ITEM</button>
                            </form>
                        </div>

                        <h3 style={{ marginBottom: '1.5rem' }}>Missões de Classe Ativas ({missions.length})</h3>
                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '3rem' }}>
                            {missions.map(m => (
                                <div key={m.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(255, 232, 31, 0.03)', borderLeft: '4px solid var(--primary)' }}>
                                    <div>
                                        <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>{m.title}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.description}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.2rem' }}>{m.reward} XP</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RECOMPENSA</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <h3 style={{ marginBottom: '1.5rem' }}>Itens de Avaliação Ativos ({activities.length})</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {activities.map(a => (
                                <div key={a.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                                    <div>
                                        <p style={{ fontWeight: '800' }}>{a.title}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.description}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: '900', color: 'var(--secondary)' }}>{a.maxScore} PONTOS</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'grades' && (
                    <div>
                        <h3 style={{ marginBottom: '2rem' }}>Diário de Notas: {selectedClass?.name}</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>ALUNO</th>
                                        {activities.map(a => (
                                            <th key={a.id} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.7rem', maxWidth: '80px' }}>
                                                {a.title.substring(0, 10)}...
                                            </th>
                                        ))}
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>AÇÃO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(s => (
                                        <StudentGradeRow
                                            key={s.id}
                                            student={s}
                                            activities={activities}
                                            grades={grades}
                                            onSaveGrade={setStudentGrade}
                                        />
                                    ))}
                                </tbody>
                            </table>
                            {students.length === 0 && <p style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum aluno para avaliar.</p>}
                        </div>
                    </div>
                )}

                {tab === 'messages' && (
                    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                        <h3 style={{ marginBottom: '2rem' }}>Mural da Guilda ({selectedClass?.name})</h3>
                        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
                            <textarea
                                className="input-field"
                                style={{ minHeight: '100px', marginBottom: '1rem' }}
                                placeholder="Escriba sua mensagem para a turma..."
                                value={msgContent}
                                onChange={e => setMsgContent(e.target.value)}
                            />
                            <button onClick={sendClassMessage} className="btn btn-primary" style={{ width: '100%' }}>
                                <Send size={18} /> ENVIAR COMUNICADO
                            </button>
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

export default DashboardAdmin;
