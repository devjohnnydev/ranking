import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const DataContextInternal = createContext(null);

export const useData = () => {
  const context = useContext(DataContextInternal);
  if (!context) {
    return {
      user: null, loading: false, classes: [], students: [], activities: [],
      messages: [], ranking: [], login: async () => false, logout: () => { },
      registerStudent: async () => { }, createClass: async () => { },
      joinClass: async () => { }, addActivity: async () => { },
      setStudentGrade: async () => { }, sendMessage: async () => { },
      updateProfile: async () => { }, approveEnrollment: async () => { }, refreshAll: () => { }
    };
  }
  return context;
};

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const DataProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('eduGameUser');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Ensure basic structure exists
      if (parsed && typeof parsed === 'object' && parsed.id) {
        return {
          id: parsed.id,
          username: parsed.username || '',
          name: parsed.name || parsed.username || 'Aventureiro',
          role: parsed.role || 'STUDENT',
          photoUrl: parsed.photoUrl || ''
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [grades, setGrades] = useState({});
  const [ranking, setRanking] = useState([]);
  const [messages, setMessages] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const fetchClassData = useCallback(async (classId) => {
    if (!classId || !user) return;
    try {
      const [resStu, resAct, resGrades, resRank, resPending] = await Promise.all([
        fetch(`${API_URL}/students?classId=${classId}`).then(r => r.json()),
        fetch(`${API_URL}/activities?classId=${classId}`).then(r => r.json()),
        fetch(`${API_URL}/grades?classId=${classId}`).then(r => r.json()),
        fetch(`${API_URL}/ranking?classId=${classId}&username=${user.username}`).then(r => r.json()),
        fetch(`${API_URL}/enrollments/pending?classId=${classId}`).then(r => r.json())
      ]);

      setStudents(Array.isArray(resStu) ? resStu : []);
      setActivities(Array.isArray(resAct) ? resAct : []);
      setRanking(Array.isArray(resRank) ? resRank : []);
      setPendingEnrollments(Array.isArray(resPending) ? resPending : []);

      const gradeMap = {};
      if (Array.isArray(resGrades)) {
        resGrades.forEach(g => {
          if (g && g.studentId) gradeMap[`${g.studentId}-${g.activityId}`] = g.score;
        });
      }
      setGrades(gradeMap);
    } catch (e) {
      console.error("fetchClassData fail", e);
    }
  }, [user?.username, user?.id]);

  const refreshAll = useCallback(async () => {
    if (!user || !user.id) return;
    try {
      setLoading(true);
      const teacherParam = user.role === 'ADMIN' ? `username=${user.username}` : (user.role === 'TEACHER' ? `teacherId=${user.id}` : `studentId=${user.id}`);

      const [resClasses, resMessages] = await Promise.all([
        fetch(`${API_URL}/classes?${teacherParam}`).then(r => r.json()),
        fetch(`${API_URL}/messages?userId=${user.id}`).then(r => r.json())
      ]);

      const classList = Array.isArray(resClasses) ? resClasses : [];
      setClasses(classList);
      setMessages(Array.isArray(resMessages) ? resMessages : []);

      if (classList.length > 0) {
        if (!selectedClass) {
          setSelectedClass(classList[0]);
        } else {
          // If already selected, re-fetch data for it
          fetchClassData(selectedClass.id);
        }
      }

      if (user.role === 'ADMIN') {
        const globalRank = await fetch(`${API_URL}/ranking?username=${user.username}`).then(r => r.json());
        setRanking(Array.isArray(globalRank) ? globalRank : []);
      }
    } catch (e) {
      console.error("refreshAll fail", e);
    } finally {
      setLoading(false);
      setNeedsRefresh(false);
    }
  }, [user?.id, user?.username, user?.role, selectedClass?.id]);

  useEffect(() => {
    if (user) {
      try {
        // Only save essential data to localStorage to avoid QuotaExceededError
        // Base64 photos are the main cause of large storage usage
        const userToSave = { ...user };
        if (userToSave.photoUrl && userToSave.photoUrl.startsWith('data:')) {
          delete userToSave.photoUrl;
        }
        localStorage.setItem('eduGameUser', JSON.stringify(userToSave));
      } catch (e) {
        console.warn("Falha ao salvar no localStorage (Quota excedida):", e);
      }
      setNeedsRefresh(true);
    } else {
      localStorage.removeItem('eduGameUser');
    }
  }, [user?.id]);

  useEffect(() => {
    if (needsRefresh) refreshAll();
  }, [needsRefresh, refreshAll]);

  useEffect(() => {
    if (selectedClass?.id) fetchClassData(selectedClass.id);
  }, [selectedClass?.id, fetchClassData]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response received:", text);
        throw new Error(`Resposta inválida do servidor (HTML recebido em vez de JSON). Isso geralmente acontece se a URL da API estiver errada ou o servidor estiver fora do ar.`);
      }

      const userData = await res.json();
      if (!res.ok) throw new Error(userData.error || 'Falha no login');
      setUser(userData);
      return true;
    } catch (e) {
      console.error("Login Error:", e);
      alert(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setClasses([]);
    setSelectedClass(null);
    setStudents([]);
    setActivities([]);
    setMessages([]);
    setNeedsRefresh(false);
  };

  const value = useMemo(() => ({
    user, login, logout, loading,
    classes, selectedClass, setSelectedClass,
    registerStudent: async (data) => {
      const res = await fetch(`${API_URL}/auth/register-student`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setUser(result);
    },
    createClass: async (name, subject) => {
      const res = await fetch(`${API_URL}/classes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, subject, teacherId: user.id }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setClasses(prev => [...prev, result]);
      setSelectedClass(result);
      return result;
    },
    joinClass: async (joinCode) => {
      const res = await fetch(`${API_URL}/classes/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: user.id, joinCode }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setNeedsRefresh(true);
    },
    addActivity: async (a) => {
      if (!selectedClass) return;
      const res = await fetch(`${API_URL}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...a, classId: selectedClass.id })
      });
      const newAct = await res.json();
      if (res.ok) {
        setActivities(prev => [newAct, ...prev]);
        fetchClassData(selectedClass.id);
      }
    },
    setStudentGrade: async (s, act, score) => {
      await fetch(`${API_URL}/grades`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: s, activityId: act, score, teacherId: user.id }) });
      setGrades(prev => ({ ...prev, [`${s}-${act}`]: score }));
    },
    ranking, messages,
    sendMessage: async (m) => {
      await fetch(`${API_URL}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...m, fromId: user.id }) });
    },
    updateProfile: async (d) => {
      const res = await fetch(`${API_URL}/profile/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
      const u = await res.json();
      setUser(u);
    },
    approveEnrollment: async (enrollmentId, status) => {
      const res = await fetch(`${API_URL}/enrollments/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, status })
      });
      if (!res.ok) throw new Error("Falha ao processar solicitação");
      setNeedsRefresh(true);
    },
    refreshAll: () => setNeedsRefresh(true)
  }), [user, loading, classes, selectedClass, students, activities, grades, ranking, messages, fetchClassData, refreshAll]);

  return (
    <DataContextInternal.Provider value={value}>
      {children}
    </DataContextInternal.Provider>
  );
};
