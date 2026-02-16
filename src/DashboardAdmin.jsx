import React, { useState, useEffect } from 'react';
import { useData } from './DataContext';
import { Trophy, Users, Star, Plus, Send, LogOut, Award, BookOpen, RefreshCw, Key } from 'lucide-react';

const DashboardAdmin = () => {
    const {
        logout, user, classes, selectedClass, setSelectedClass,
        addActivity, setStudentGrade, ranking, refreshAll, loading
    } = useData();

    const [tab, setTab] = useState('ranking');
    const [newActivity, setNewActivity] = useState({ titulo: '', descricao: '', nota_maxima: 10 });
    const [msgContent, setMsgContent] = useState('');

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

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>RANKING SENAI</h1>
                    <h2 style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>Mestre {user?.nome}</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 'bold' }}>CÓDIGO DA SUA TURMA: {user?.codigo_turma}</p>
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

            <nav style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                <button onClick={() => setTab('ranking')} className={`btn ${tab === 'ranking' ? 'btn-active' : ''}`}><Trophy size={18} /> Ranking</button>
                <button onClick={() => setTab('atividades')} className={`btn ${tab === 'atividades' ? 'btn-active' : ''}`}><Plus size={18} /> Atividades</button>
            </nav>

            <main className="glass-card" style={{ padding: '2rem' }}>
                {tab === 'ranking' && (
                    <div>
                        <h3 style={{ marginBottom: '2rem' }}>Classificação Local: {selectedClass?.nome || 'Minha Turma'}</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1rem' }}>POS</th>
                                    <th style={{ padding: '1rem' }}>ALUNO</th>
                                    <th style={{ padding: '1rem' }}>XP TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.map((s, idx) => (
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
                    <div>
                        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', background: 'rgba(255, 255, 255, 0.05)' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Lançar Novo Item de Avaliação</h3>
                            <form onSubmit={handleAddActivity} style={{ display: 'grid', gap: '1.2rem' }}>
                                <input className="input-field" placeholder="Título da Atividade" value={newActivity.titulo} onChange={e => setNewActivity({ ...newActivity, titulo: e.target.value })} required />
                                <textarea className="input-field" placeholder="Descrição (Opcional)" value={newActivity.descricao} onChange={e => setNewActivity({ ...newActivity, descricao: e.target.value })} />
                                <input className="input-field" type="number" placeholder="Nota Máxima (Ex: 10)" value={newActivity.nota_maxima} onChange={e => setNewActivity({ ...newActivity, nota_maxima: e.target.value })} required />
                                <button type="submit" className="btn btn-primary">CRIAR ITEM</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardAdmin;
