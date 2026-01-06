// --- THEME MANAGEMENT ---
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    const isDark = body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
    localStorage.setItem('theme', newTheme);
}

const savedTheme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', savedTheme);
if(document.getElementById('theme-icon')) {
    document.getElementById('theme-icon').className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// --- STATE MANAGEMENT ---
const DEFAULT_STATE = {
    user: { name: "Warrior", examDate: "2026-02-01", target: "GATE 2026" },
    subjects: [], journal: [], reports: [], dailyGoals: [],
    settings: {
        workTypes: ["Concept", "Practice", "Revision"],
        activeModules: ['Dashboard', 'Syllabus', 'Mistakes', 'Monthly Reports', 'Configuration']
    }
};

let state = JSON.parse(localStorage.getItem('supreme_gate_v3')) || DEFAULT_STATE;
if (!state.dailyGoals) state.dailyGoals = [];

const save = () => localStorage.setItem('supreme_gate_v3', JSON.stringify(state));

const Engine = {
    init() { this.renderNav(); this.navigate('Dashboard'); },
    renderNav() {
        const nav = document.getElementById('main-nav');
        nav.innerHTML = state.settings.activeModules.map(m => `
            <button class="nav-item ${this.currentView === m ? 'active' : ''}" onclick="Engine.navigate('${m}')">${m}</button>
        `).join('');
    },
    navigate(view) {
        this.currentView = view;
        this.renderNav();
        const container = document.getElementById('view-container');
        container.innerHTML = `<div class="view-content">${this.getViewContent(view)}</div>`;
    },
    getViewContent(view) {
        switch(view) {
            case 'Dashboard': return Views.Dashboard();
            case 'Syllabus': return Views.Syllabus();
            case 'Mistakes': return Views.Mistakes();
            case 'Monthly Reports': return Views.Reports();
            case 'Configuration': return Views.Configuration();
            default: return Views.Dashboard();
        }
    }
};

const Views = {
    Dashboard: () => {
        const days = Math.ceil((new Date(state.user.examDate) - new Date()) / (86400000));
        const totalTopics = state.subjects.reduce((acc, s) => acc + s.topics.length, 0);
        const completed = state.subjects.reduce((acc, s) => acc + s.topics.filter(t => t.done).length, 0);
        const progress = totalTopics ? Math.round((completed / totalTopics) * 100) : 0;
        
        return `
            <div class="section-header"><h1>Hello, ${state.user.name} 👋</h1><span class="tag">Supreme Access</span></div>
            <div class="stats-grid">
                <div class="stat-card"><div>Time Remaining</div><div class="stat-val">${days} Days</div><div class="tag">${state.user.target}</div></div>
                <div class="stat-card"><div>Syllabus Progress</div><div class="stat-val">${progress}%</div><div style="height: 8px; background: var(--border); border-radius: 10px;"><div class="progress-bar" style="width:${progress}%"></div></div></div>
                <div class="stat-card"><div>Mistakes Logged</div><div class="stat-val">${state.journal.length}</div><button class="btn btn-primary" style="width:100%" onclick="Engine.navigate('Mistakes')">Review</button></div>
            </div>

            <div class="goal-board">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
                    <h2 style="margin:0"><i class="fas fa-bullseye" style="color:var(--danger); margin-right:10px"></i>Daily Mission Control</h2>
                    <span class="tag">${state.dailyGoals.filter(g => g.done).length}/${state.dailyGoals.length} Done</span>
                </div>
                <div class="goal-input-area">
                    <input type="text" id="goal-input" placeholder="What is your focus for today?" onkeypress="if(event.key==='Enter') Actions.addGoal()">
                    <button class="btn btn-primary" onclick="Actions.addGoal()">Deploy</button>
                </div>
                <div id="goals-list">
                    ${state.dailyGoals.map((g, idx) => `
                        <div class="goal-item">
                            <input type="checkbox" style="width:18px; height:18px; cursor:pointer" ${g.done ? 'checked' : ''} onchange="Actions.toggleGoal(${idx})">
                            <span class="goal-text ${g.done ? 'done' : ''}">${g.text}</span>
                            <button class="btn-icon danger" onclick="Actions.deleteGoal(${idx})"><i class="fas fa-trash"></i></button>
                        </div>
                    `).join('')}
                    ${state.dailyGoals.length === 0 ? '<div style="text-align:center; padding:1rem; opacity:0.5">Your mission board is empty. Set a goal to begin.</div>' : ''}
                </div>
            </div>`;
    },
    Syllabus: () => `
        <div class="section-header"><h1>Curriculum Tracker</h1><button class="btn btn-primary" onclick="Views.modals.addSubject()">+ Add Subject</button></div>
        ${state.subjects.map((sub, sIdx) => `
            <div class="subject-card">
                <div class="subject-head" onclick="Actions.toggleAccordion(${sIdx})">
                    <div>
                        <i class="fas fa-chevron-right" id="chevron-${sIdx}" style="margin-right: 10px; transition: 0.3s"></i>
                        <strong>${sub.name}</strong>
                    </div>
                    <div class="flex" onclick="event.stopPropagation()">
                        <button class="btn-icon" title="Edit Subject" onclick="Views.modals.editSubject(${sIdx})"><i class="fas fa-edit"></i></button>
                        <button class="btn" onclick="Views.modals.addTopic(${sIdx})">+ Topic</button>
                        <button class="btn-icon danger" onclick="Actions.deleteSubject(${sIdx})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="topic-container" id="container-${sIdx}">
                    ${sub.topics.map((topic, tIdx) => `
                        <div class="topic-row">
                            <span style="font-weight:500">${topic.title}</span>
                            <div class="flex">${state.settings.workTypes.map(w => `<label style="font-size: 0.65rem; text-align:center; cursor:pointer"><div>${w}</div><input type="checkbox" ${topic.work && topic.work[w] ? 'checked' : ''} onchange="Actions.toggleWork(${sIdx}, ${tIdx}, '${w}')"></label>`).join('')}</div>
                            <input type="checkbox" style="width:20px; height:20px; cursor:pointer" ${topic.done ? 'checked' : ''} onchange="Actions.toggleTopic(${sIdx}, ${tIdx})">
                            <button class="btn-icon" title="Edit Topic" onclick="Views.modals.editTopic(${sIdx}, ${tIdx})"><i class="fas fa-pen"></i></button>
                            <button class="btn-icon danger" onclick="Actions.deleteTopic(${sIdx}, ${tIdx})"><i class="fas fa-times"></i></button>
                        </div>`).join('')}
                    ${sub.topics.length === 0 ? '<div style="padding: 1.5rem; text-align:center; opacity:0.5">No topics yet. Add one to start tracking.</div>' : ''}
                </div>
            </div>`).join('')}`,
    Mistakes: () => `
        <div class="section-header"><h1>Mistake Journal</h1><button class="btn btn-primary" onclick="Views.modals.addMistake()">+ Log</button></div>
        ${state.journal.map((m, idx) => `
            <div class="journal-entry">
                <div style="display:flex; justify-content:space-between"><div><h3>${m.title}</h3><span class="tag">${m.subject}</span></div><button class="btn btn-danger" onclick="Actions.deleteMistake(${idx})">Delete</button></div>
                <p style="margin: 1rem 0; opacity: 0.8">${m.desc}</p>
                <div class="flex" style="font-size:0.85rem; font-weight:600"><span>📅 ${m.date}</span><span style="color:var(--p-600)">📺 Lec: ${m.lectures || 0}</span><span style="color:#22c55e">📝 PYQs: ${m.pyqs || 0}</span></div>
            </div>`).reverse().join('')}`,
    Reports: () => `
        <div class="section-header"><h1>Performance Reports</h1><button class="btn btn-primary" onclick="Views.modals.addReport()">+ Log Month</button></div>
        ${state.reports.map((r, idx) => `
            <div class="report-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem"><h2>${r.monthYear}</h2><button class="btn btn-danger" onclick="Actions.deleteReport(${idx})">Delete</button></div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:12px;"><div>Lec Done</div><div style="font-size:2rem; font-weight:900; color:var(--accent)">${r.totalLectures}</div></div>
                    <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:12px;"><div>PYQs Solved</div><div style="font-size:2rem; font-weight:900; color:#4ade80">${r.totalPyqs}</div></div>
                </div>
                <div style="margin-top:1rem; opacity:0.8"><em>Reflections: ${r.notes}</em></div>
            </div>`).reverse().join('')}`,
    Configuration: () => `
        <div class="section-header"><h1>Config</h1></div>
        <div class="stat-card" style="max-width: 400px">
            <label>Name</label><input type="text" value="${state.user.name}" id="conf-name">
            <label>Exam Date</label><input type="date" value="${state.user.examDate}" id="conf-date">
            <label>Target</label><input type="text" value="${state.user.target}" id="conf-target">
            <br><br><button class="btn btn-primary" style="width:100%" onclick="Actions.saveConfig()">Update</button>
        </div>`,
    modals: {
        addSubject: () => { const n = prompt("Subject Name?"); if(n){state.subjects.push({name:n, topics:[]}); save(); Engine.navigate('Syllabus');} },
        editSubject: (i) => { const n = prompt("Edit Subject Name?", state.subjects[i].name); if(n){state.subjects[i].name = n; save(); Engine.navigate('Syllabus');} },
        addTopic: (i) => { const t = prompt("Topic Name?"); if(t){state.subjects[i].topics.push({title:t, done:false, work:{}}); save(); Engine.navigate('Syllabus');} },
        editTopic: (si, ti) => { const t = prompt("Edit Topic Name?", state.subjects[si].topics[ti].title); if(t){state.subjects[si].topics[ti].title = t; save(); Engine.navigate('Syllabus');} },
        addMistake: () => {
            const t = prompt("Title?"); if(!t) return;
            const d = prompt("Correction?");
            const s = prompt("Subject?");
            const l = prompt("Lec?", "0");
            const p = prompt("PYQs?", "0");
            state.journal.push({title:t, desc:d, subject:s, lectures:parseInt(l), pyqs:parseInt(p), date:new Date().toLocaleDateString()});
            save(); Engine.navigate('Mistakes');
        },
        addReport: () => {
            const m = prompt("Month (Oct 2025):"); if(!m) return;
            const l = prompt("Total Lec?");
            const p = prompt("Total PYQs?");
            const n = prompt("Notes:");
            state.reports.push({monthYear:m, totalLectures:l, totalPyqs:p, notes:n});
            save(); Engine.navigate('Monthly Reports');
        }
    }
};

const Actions = {
    addGoal: () => {
        const input = document.getElementById('goal-input');
        if (input.value.trim()) {
            state.dailyGoals.push({ text: input.value.trim(), done: false });
            save();
            Engine.navigate('Dashboard');
        }
    },
    toggleGoal: (idx) => {
        state.dailyGoals[idx].done = !state.dailyGoals[idx].done;
        save();
        Engine.navigate('Dashboard');
    },
    deleteGoal: (idx) => {
        state.dailyGoals.splice(idx, 1);
        save();
        Engine.navigate('Dashboard');
    },
    toggleAccordion: (i) => {
        const container = document.getElementById(`container-${i}`);
        const chevron = document.getElementById(`chevron-${i}`);
        if(!container) return;
        const isActive = container.classList.contains('active');
        
        container.classList.toggle('active');
        chevron.style.transform = isActive ? 'rotate(0deg)' : 'rotate(90deg)';
    },
    toggleTopic: (s, t) => { state.subjects[s].topics[t].done = !state.subjects[s].topics[t].done; save(); },
    toggleWork: (s, t, w) => { if(!state.subjects[s].topics[t].work) state.subjects[s].topics[t].work = {}; state.subjects[s].topics[t].work[w] = !state.subjects[s].topics[t].work[w]; save(); },
    deleteSubject: (i) => { if(confirm("Delete Subject and all its topics?")){state.subjects.splice(i,1); save(); Engine.navigate('Syllabus');} },
    deleteTopic: (si, ti) => { if(confirm("Delete this topic?")){state.subjects[si].topics.splice(ti,1); save(); Engine.navigate('Syllabus');} },
    deleteMistake: (i) => { if(confirm("Delete?")){state.journal.splice(i,1); save(); Engine.navigate('Mistakes');} },
    deleteReport: (i) => { if(confirm("Delete?")){state.reports.splice(i,1); save(); Engine.navigate('Monthly Reports');} },
    saveConfig: () => {
        state.user.name = document.getElementById('conf-name').value;
        state.user.examDate = document.getElementById('conf-date').value;
        state.user.target = document.getElementById('conf-target').value;
        save(); Engine.navigate('Dashboard');
    }
};

Engine.init();