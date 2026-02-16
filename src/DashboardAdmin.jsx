import React, { useState, useEffect, useMemo } from 'react';
import { useData } from './DataContext';
import { Trophy, Users, Star, Plus, Send, LogOut, Award, BookOpen, RefreshCw, Key, Image as ImageIcon, UserCircle, CheckCircle, MessageCircle, Megaphone, Lock, ShieldAlert, Filter, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DashboardAdmin = () => {
    const {
        logout, user, classes, selectedClass, setSelectedClass,
        addActivity, setStudentGrade, ranking, refreshAll, loading,
        createClass, updateProfile, activities, students, sendMessage, messages, resetStudentPassword
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

    // Messaging state
    const [msgTarget, setMsgTarget] = useState('turma'); // 'turma' or alumnoId
    const [msgContent, setMsgContent] = useState('');

    // Admin filters
    const [adminFilterProfessor, setAdminFilterProfessor] = useState('all');

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
            alert('Nota salva e aluno notificado!');
        } catch (err) {
            alert('Erro ao salvar nota');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!msgContent.trim()) return;
        try {
            const data = { conteudo: msgContent };
            if (msgTarget === 'turma') {
                if (!selectedClass) return alert('Selecione uma turma');
                data.turmaId = selectedClass.id;
            } else {
                data.alunoId = parseInt(msgTarget);
            }
            await sendMessage(data);
            setMsgContent('');
            alert('Mensagem enviada!');
        } catch (err) {
            alert('Erro ao enviar mensagem');
        }
    };

    const handleResetPassword = async (id, nome) => {
        if (window.confirm(`Deseja resetar a senha de ${nome} para 'senai123'?`)) {
            try {
                await resetStudentPassword(id);
                alert('Senha resetada com sucesso para senai123');
            } catch (err) {
                alert('Erro ao resetar senha');
            }
        }
    };

    const filteredStudents = students.filter(s => !selectedClass || s.turmaId === selectedClass.id);
    const filteredActivities = activities.filter(a => !selectedClass || a.turmaId === selectedClass.id);
    const filteredMessages = messages.filter(m => !selectedClass || m.turmaId === selectedClass.id || (m.aluno && filteredStudents.some(s => s.id === m.alunoId)));

    // Ranking filtering logic
    const filteredRanking = useMemo(() => {
        if (user?.role === 'ADMIN') {
            if (adminFilterProfessor === 'all') return ranking;
            return ranking.filter(r => r.professorId === parseInt(adminFilterProfessor));
        }
        // For PROFESSOR, filter by selected class
        if (!selectedClass) return [];
        return ranking.filter(r => r.turmaId === selectedClass.id);
    }, [ranking, user?.role, adminFilterProfessor, selectedClass]);

    const professorsList = useMemo(() => {
        if (user?.role !== 'ADMIN') return [];
        const uniqueProfessors = [];
        const map = new Map();
        for (const item of ranking) {
            if (!map.has(item.professorId)) {
                map.set(item.professorId, true);
                uniqueProfessors.push({ id: item.professorId, nome: item.professorNome });
            }
        }
        return uniqueProfessors;
    }, [ranking, user?.role]);

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
                        <h2 style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>{user?.role === 'ADMIN' ? 'Administrador Supremo' : `Mestre ${user?.nome}`}</h2>
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
                            {user?.role !== 'ADMIN' && (
                                <button onClick={() => setShowNewClass(true)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                                    <Plus size={16} /> NOVA TURMA
                                </button>
                            )}
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

            <nav style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setTab('ranking')} className={`btn ${tab === 'ranking' ? 'btn-active' : ''}`}><Trophy size={18} /> Ranking</button>
                <button onClick={() => setTab('atividades')} className={`btn ${tab === 'atividades' ? 'btn-active' : ''}`}><Plus size={18} /> Atividades/Notas</button>
                <button onClick={() => setTab('mensagens')} className={`btn ${tab === 'mensagens' ? 'btn-active' : ''}`}><MessageCircle size={18} /> Mensagens</button>
                <button onClick={() => setTab('alunos')} className={`btn ${tab === 'alunos' ? 'btn-active' : ''}`}><Users size={18} /> Alunos</button>
            </nav>

            <main className="glass-card" style={{ padding: '2.5rem' }}>
                {tab === 'ranking' && (
                    <div>
                        {user?.role === 'ADMIN' && (
                            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Filter size={16} color="var(--primary)" />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Filtrar por Mestre:</span>
                                    <select
                                        className="input-field"
                                        style={{ width: 'auto', padding: '0.2rem', marginBottom: 0 }}
                                        value={adminFilterProfessor}
                                        onChange={e => setAdminFilterProfessor(e.target.value)}
                                    >
                                        <option value="all">TODOS OS MESTRES</option>
                                        {professorsList.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </select>
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                    Mostrando {filteredRanking.length} aventureiros
                                </div>
                            </div>
                        )}
                        {!selectedClass && user?.role !== 'ADMIN' ? (
                            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                <Trophy size={40} style={{ marginBottom: '1rem' }} />
                                <p>Selecione uma turma para ver o ranking regional.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                                            <th style={{ padding: '1rem' }}>POSIÇÃO</th>
                                            <th style={{ padding: '1rem' }}>ALUNO</th>
                                            <th style={{ padding: '1rem' }}>GUILDA (TURMA)</th>
                                            {user?.role === 'ADMIN' && <th style={{ padding: '1rem' }}>MESTRE</th>}
                                            <th style={{ padding: '1rem' }}>XP TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRanking.map((r, i) => (
                                            <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {i + 1}º
                                                    {r.posicao_anterior && (
                                                        <>
                                                            {(i + 1) < r.posicao_anterior ? (
                                                                <TrendingUp size={16} color="var(--success)" title={`Subiu ${r.posicao_anterior - (i + 1)} posições`} />
                                                            ) : (i + 1) > r.posicao_anterior ? (
                                                                <TrendingDown size={16} color="var(--danger)" title={`Caiu ${(i + 1) - r.posicao_anterior} posições`} />
                                                            ) : (
                                                                <Minus size={16} color="var(--text-muted)" opacity={0.3} />
                                                            )}
                                                        </>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem' }}>{r.nome}</td>
                                                <td style={{ padding: '1rem', color: 'var(--primary)' }}>{r.turmaNome}</td>
                                                {user?.role === 'ADMIN' && <td style={{ padding: '1rem', color: 'var(--secondary)' }}>{r.professorNome}</td>}
                                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{r.xp} XP</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'alunos' && (
                    <div>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={20} /> Alunos da Guilda</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '1rem' }}>NOME</th>
                                        <th style={{ padding: '1rem' }}>E-MAIL</th>
                                        <th style={{ padding: '1rem' }}>TURMA</th>
                                        <th style={{ padding: '1rem' }}>AÇÕES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem' }}>{s.nome}</td>
                                            <td style={{ padding: '1rem', opacity: 0.8 }}>{s.email || '—'}</td>
                                            <td style={{ padding: '1rem' }}>{s.turma?.nome}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <button onClick={() => handleResetPassword(s.id, s.nome)} className="btn glass-card" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', color: 'var(--warning)', gap: '0.4rem' }}>
                                                    <ShieldAlert size={14} /> RESETAR SENHA
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStudents.length === 0 && (
                                        <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>{selectedClass ? 'Nenhum aluno encontrado para esta turma.' : 'Selecione uma turma para ver os alunos.'}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'atividades' && (
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Lançar Nova Missão</h3>
                            <form onSubmit={handleAddActivity} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Título</label>
                                    <input className="input-field" placeholder="Ex: Prova de Backend" value={newActivity.titulo} onChange={e => setNewActivity({ ...newActivity, titulo: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Nota Máxima</label>
                                    <input className="input-field" type="number" value={newActivity.nota_maxima} onChange={e => setNewActivity({ ...newActivity, nota_maxima: e.target.value })} />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={!selectedClass}>LANÇAR MISSÃO</button>
                            </form>
                            {!selectedClass && <p style={{ color: 'var(--danger)', fontSize: '0.7rem', marginTop: '0.5rem' }}>* Selecione uma turma primeiro para lançar atividades.</p>}
                        </div>

                        <div>
                            <h3 style={{ marginBottom: '1.5rem' }}>Avaliar Aventureiros</h3>
                            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                                {filteredActivities.map(a => (
                                    <button
                                        key={a.id}
                                        onClick={() => setSelectedActivity(a)}
                                        className={`btn ${selectedActivity?.id === a.id ? 'btn-active' : 'glass-card'}`}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {a.titulo}
                                    </button>
                                ))}
                                {filteredActivities.length === 0 && <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>{selectedClass ? 'Nenhuma atividade lançada para esta turma.' : 'Selecione uma turma para ver as missões.'}</p>}
                            </div>

                            {selectedActivity && (
                                <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                                <th style={{ padding: '1rem' }}>ALUNO</th>
                                                <th style={{ padding: '1rem' }}>NOTA ATUAL</th>
                                                <th style={{ padding: '1rem' }}>NOVA NOTA</th>
                                                <th style={{ padding: '1rem' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map(s => {
                                                const grade = selectedActivity.notas?.find(g => g.alunoId === s.id);
                                                return (
                                                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <td style={{ padding: '1rem' }}>{s.nome}</td>
                                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{grade ? grade.valor : '—'}</td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <input
                                                                className="input-field"
                                                                type="number"
                                                                step="0.1"
                                                                placeholder="0.0"
                                                                style={{ width: '80px', padding: '0.4rem' }}
                                                                value={editGrades[`${s.id}-${selectedActivity.id}`] || ''}
                                                                onChange={e => setEditGrades({ ...editGrades, [`${s.id}-${selectedActivity.id}`]: e.target.value })}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <button onClick={() => handleSetGrade(s.id, selectedActivity.id)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>SALVAR</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'mensagens' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
                        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Send size={20} /> Enviar Mensagem</h3>
                            <form onSubmit={handleSendMessage} style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', display: 'block' }}>Para quem?</label>
                                    <select className="input-field" value={msgTarget} onChange={e => setMsgTarget(e.target.value)} style={{ padding: '0.5rem' }}>
                                        <option value="turma">📣 Todos da Turma Selecionada</option>
                                        <optgroup label="Alunos Individuais">
                                            {filteredStudents.map(s => <option key={s.id} value={s.id}>👤 {s.nome}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                                <textarea className="input-field" placeholder="Escreva sua mensagem aqui..." value={msgContent} onChange={e => setMsgContent(e.target.value)} style={{ minHeight: '120px' }} />
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!selectedClass && msgTarget === 'turma'}>ENVIAR MENSAGEM</button>
                            </form>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Histórico de Recados</h3>
                            <div style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {filteredMessages.map(m => (
                                    <div key={m.id} className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderLeft: m.turmaId ? '4px solid var(--primary)' : '4px solid var(--secondary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: m.turmaId ? 'var(--primary)' : 'var(--secondary)' }}>
                                                {m.turmaId ? '📣 PARA TURMA' : `👤 PARA: ${m.aluno?.nome}`}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{new Date(m.data_criacao).toLocaleString()}</span>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', margin: 0 }}>{m.conteudo}</p>
                                    </div>
                                ))}
                                {filteredMessages.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5 }}>{selectedClass ? 'Nenhuma mensagem enviada nesta turma.' : 'Selecione uma turma para ver o histórico.'}</p>}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                <p>Gerenciador de Ranking - SENAI</p>
            </footer>
        </div>
    );
};

export default DashboardAdmin;
