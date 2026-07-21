"use client";

import { useEffect, useMemo, useState } from "react";

const initialMessages = [
  { from: "pharmacy", text: "Καλημέρα Μαρία! Πώς αισθάνεστε σήμερα με τη βιταμίνη D;", time: "10:35" },
  { from: "patient", text: "Είμαι καλά, αλλά έχω λίγη ενόχληση στο στομάχι.", time: "10:39" },
  { from: "pharmacy", text: "Ευχαριστώ που μας ενημερώσατε. Πάρτε τη μετά το κύριο γεύμα και ενημερώστε μας ξανά αύριο.", time: "10:41" },
];

const initialEvents = [
  { date: "12 Ιουλίου", title: "Έναρξη πλάνου", detail: "Βιταμίνη D • 1 φορά την ημέρα", kind: "care", icon: "✚" },
  { date: "18 Ιουλίου", title: "Φωτογραφία προόδου", detail: "Καταγράφηκε στο πλάνο φροντίδας", kind: "photo", icon: "▣" },
];

const reactionMeta = {
  better: { emoji: "🙂", label: "Καλύτερα", detail: "Αισθάνομαι καλύτερα σήμερα" },
  same: { emoji: "😐", label: "Ίδια", detail: "Δεν παρατηρώ κάποια αλλαγή" },
  worse: { emoji: "☹", label: "Χειρότερα", detail: "Χρειάζομαι καθοδήγηση" },
};

export default function Home() {
  const [role, setRole] = useState("patient");
  const [patientView, setPatientView] = useState("home");
  const [proView, setProView] = useState("dashboard");
  const [messages, setMessages] = useState(initialMessages);
  const [events, setEvents] = useState(initialEvents);
  const [reaction, setReaction] = useState(null);
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [composer, setComposer] = useState("");
  const [toast, setToast] = useState("");
  const [pharmacyReply, setPharmacyReply] = useState("Μαρία, είδα την ενημέρωσή σας. Θα σας καλέσουμε σήμερα για έναν σύντομο έλεγχο.");
  const [taskOpen, setTaskOpen] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("foxfollowup-demo-v1");
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved.messages) setMessages(saved.messages);
      if (saved.events) setEvents(saved.events);
      if (saved.reaction) setReaction(saved.reaction);
      if (typeof saved.taskOpen === "boolean") setTaskOpen(saved.taskOpen);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("foxfollowup-demo-v1", JSON.stringify({ messages, events, reaction, taskOpen }));
  }, [messages, events, reaction, taskOpen]);

  const notify = (text) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2600);
  };

  const sendMessage = (from, text) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { from, text: text.trim(), time: new Date().toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" }) }]);
    if (from === "patient") setTaskOpen(true);
    notify(from === "patient" ? "Το μήνυμα στάλθηκε στο φαρμακείο" : "Η απάντηση στάλθηκε στη Μαρία");
  };

  const sendReaction = (key) => {
    const meta = reactionMeta[key];
    setReaction(key);
    setTaskOpen(true);
    setEvents((prev) => [...prev.filter((e) => e.kind !== "reaction"), { date: "Σήμερα", title: `${meta.emoji} ${meta.label}`, detail: meta.detail, kind: "reaction", icon: meta.emoji }]);
    setAttachmentOpen(false);
    setPatientView("timeline");
    notify("Η ενημέρωση προστέθηκε στην πορεία σας");
  };

  const resetDemo = () => {
    setMessages(initialMessages);
    setEvents(initialEvents);
    setReaction(null);
    setTaskOpen(true);
    setPatientView("home");
    setProView("dashboard");
    localStorage.removeItem("foxfollowup-demo-v1");
    notify("Το demo ξεκίνησε από την αρχή");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" onClick={() => role === "patient" ? setPatientView("home") : setProView("dashboard")}>
          <span className="brand-mark">✚</span>
          <div><strong>FoxFollowUp</strong><small>by PharmaFox</small></div>
        </div>
        <div className="role-switch" aria-label="Επιλογή ρόλου">
          <button className={role === "patient" ? "active" : ""} onClick={() => setRole("patient")}>Άνθρωπος</button>
          <button className={role === "pharmacy" ? "active" : ""} onClick={() => setRole("pharmacy")}>Φαρμακείο {taskOpen && <i />}</button>
        </div>
        <button className="ghost-button" onClick={resetDemo}>↻ Επανεκκίνηση</button>
      </header>

      {role === "patient" ? (
        <PatientApp
          view={patientView}
          setView={setPatientView}
          messages={messages}
          composer={composer}
          setComposer={setComposer}
          sendMessage={sendMessage}
          events={events}
          reaction={reaction}
          attachmentOpen={attachmentOpen}
          setAttachmentOpen={setAttachmentOpen}
          sendReaction={sendReaction}
          notify={notify}
        />
      ) : (
        <PharmacyApp
          view={proView}
          setView={setProView}
          messages={messages}
          events={events}
          reaction={reaction}
          taskOpen={taskOpen}
          setTaskOpen={setTaskOpen}
          reply={pharmacyReply}
          setReply={setPharmacyReply}
          sendMessage={sendMessage}
          notify={notify}
        />
      )}
      <footer className="prototype-footer">
        <strong>© 2026 Zacharia Apostolou — FOXFOLLOWUP concept &amp; prototype.</strong>
        <span>All rights reserved · Competition demo · All names and health data shown are fictional.</span>
      </footer>
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}

function PatientApp({ view, setView, messages, composer, setComposer, sendMessage, events, reaction, attachmentOpen, setAttachmentOpen, sendReaction, notify }) {
  return (
    <section className="patient-stage">
      <div className="story-panel desktop-only">
        <span className="eyebrow">OPENAI BUILD WEEK 2026</span>
        <h1>Η φροντίδα συνεχίζεται στο σπίτι.</h1>
        <p>Ένας πραγματικός κύκλος after-sales φροντίδας: ενημέρωση, καθοδήγηση, εμπιστοσύνη και σωστή επιστροφή στο ίδιο φαρμακείο.</p>
        <div className="journey">
          <JourneyStep n="1" title="Στείλε ενημέρωση" text="Πάτησε Chat → + → Άμεση ενημέρωση." />
          <JourneyStep n="2" title="Δες το Timeline" text="Η εμπειρία γίνεται δομημένο γεγονός." />
          <JourneyStep n="3" title="Άλλαξε ρόλο" text="Το φαρμακείο βλέπει νέα εργασία και απαντά." />
        </div>
        <div className="human-first"><span>♡</span><div><strong>Πρώτα ο άνθρωπος</strong><small>Η πώληση ακολουθεί την άψογη φροντίδα.</small></div></div>
      </div>

      <div className="phone-frame">
        <div className="phone-status"><span>9:41</span><span>● ◒ ▰</span></div>
        <PatientNav view={view} setView={setView} />
        <div className="phone-body">
          {view === "home" && <PatientHome setView={setView} reaction={reaction} />}
          {view === "chat" && <PatientChat messages={messages} composer={composer} setComposer={setComposer} sendMessage={sendMessage} attachmentOpen={attachmentOpen} setAttachmentOpen={setAttachmentOpen} sendReaction={sendReaction} notify={notify} />}
          {view === "timeline" && <PatientTimeline events={events} setView={setView} />}
          {view === "plan" && <CarePlan setView={setView} />}
          {view === "profile" && <PatientProfile />}
        </div>
      </div>
    </section>
  );
}

function JourneyStep({ n, title, text }) {
  return <div className="journey-step"><span>{n}</span><div><strong>{title}</strong><small>{text}</small></div></div>;
}

function PatientHome({ setView, reaction }) {
  return <div className="screen fade-in">
    <div className="mobile-header"><div><small>Καλημέρα,</small><h2>Μαρία</h2></div><button>●</button></div>
    <h3 className="section-title">Η φροντίδα μου</h3>
    <button className="followup-card" onClick={() => setView("plan")}>
      <span className="status-pill">ΕΝΕΡΓΟ FOLLOW-UP</span>
      <strong>Υποστήριξη βιταμίνης D</strong>
      <small>Ξεκίνησε 12 Ιουλίου • Επόμενος έλεγχος 26 Ιουλίου</small>
      <p>Δείτε το πλάνο και τις οδηγίες του φαρμακείου.</p>
      <b>Προβολή πλάνου →</b>
    </button>
    <button className="primary-action" onClick={() => setView("chat")}>♡ Μίλησε με το φαρμακείο</button>
    <div className="quick-grid">
      <button onClick={() => setView("plan")}><b>✚</b><span>Αγωγή</span><small>Πλάνο</small></button>
      <button onClick={() => setView("timeline")}><b>◉</b><span>Η πορεία μου</span><small>Timeline</small></button>
      <button onClick={() => setView("chat")}><b>◇</b><span>Ραντεβού</span><small>Αίτημα</small></button>
    </div>
    <button className="update-card" onClick={() => setView("timeline")}>
      <small>ΤΕΛΕΥΤΑΙΑ ΕΝΗΜΕΡΩΣΗ</small>
      <strong>{reaction ? `${reactionMeta[reaction].emoji} ${reactionMeta[reaction].label} — στάλθηκε στο φαρμακείο` : "Το φαρμακείο έστειλε νέο μήνυμα για την πορεία σας."}</strong>
      <span>Σήμερα, 10:42 →</span>
    </button>
    <p className="safety-note">Για επείγον περιστατικό καλέστε το 112 ή τον γιατρό σας.</p>
  </div>;
}

function PatientChat({ messages, composer, setComposer, sendMessage, attachmentOpen, setAttachmentOpen, sendReaction, notify }) {
  const submit = () => { sendMessage("patient", composer); setComposer(""); };
  return <div className="screen chat-screen fade-in">
    <div className="chat-head"><span className="avatar">✚</span><div><strong>PharmaFox</strong><small><i /> Συνήθως απαντά σύντομα</small></div><b>ⓘ</b></div>
    <div className="emergency">! Για επείγον περιστατικό καλέστε το 112 ή τον γιατρό σας.</div>
    <div className="messages">
      {messages.map((m, i) => <div key={i} className={`bubble ${m.from}`}><span>{m.text}</span><small>{m.time}{m.from === "patient" ? " ✓✓" : ""}</small></div>)}
    </div>
    {attachmentOpen && <div className="attachment-sheet">
      <button onClick={() => notify("Επιλέχθηκε φωτογραφία — demo")}><span>▣</span><div><strong>Φωτογραφία</strong><small>Από τη συσκευή</small></div></button>
      <button onClick={() => notify("Άνοιξε η κάμερα — demo")}><span>⌾</span><div><strong>Κάμερα</strong><small>Λήψη τώρα</small></div></button>
      <button onClick={() => notify("Ηχογράφηση voice — demo")}><span>◉</span><div><strong>Ηχητικό μήνυμα</strong><small>Voice-first επικοινωνία</small></div></button>
      <div className="reaction-box"><strong>Πώς πάει η αγωγή;</strong><div>{Object.entries(reactionMeta).map(([key, meta]) => <button key={key} onClick={() => sendReaction(key)}><b>{meta.emoji}</b><small>{meta.label}</small></button>)}</div></div>
    </div>}
    <div className="composer"><button onClick={() => setAttachmentOpen((v) => !v)}>＋</button><input value={composer} onChange={(e) => setComposer(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Γράψτε μήνυμα…"/><button className="mic" onClick={() => notify("Voice-to-text ενεργοποιήθηκε — demo")}>●</button><button className="send" onClick={submit}>➤</button></div>
  </div>;
}

function PatientTimeline({ events, setView }) {
  return <div className="screen fade-in">
    <div className="title-row"><div><span className="eyebrow">Η ΠΟΡΕΙΑ ΜΟΥ</span><h2>Ενέργεια & φροντίδα</h2></div><span className="leaf">❧</span></div>
    <div className="goal-card"><small>ΣΤΟΧΟΣ</small><strong>Περισσότερη ενέργεια, καθημερινά</strong><span>Έναρξη: 12 Ιουλίου • Έλεγχος: 26 Ιουλίου</span></div>
    <div className="timeline"><h3>Χρονολόγιο</h3>{events.map((e, i) => <div className={`timeline-item ${e.kind}`} key={`${e.kind}-${i}`}><div className="timeline-dot">{e.icon}</div><div><small>{e.date}</small><strong>{e.title}</strong><p>{e.detail}</p></div></div>)}</div>
    <button className="primary-action" onClick={() => setView("chat")}>＋ Προσθήκη ενημέρωσης</button>
    <button className="text-action" onClick={() => setView("chat")}>Μίλησε με το φαρμακείο</button>
  </div>;
}

function CarePlan({ setView }) {
  return <div className="screen fade-in"><div className="title-row"><div><span className="eyebrow">ΕΝΕΡΓΟ ΠΛΑΝΟ</span><h2>Το πλάνο φροντίδας μου</h2></div><span className="status-pill">ΕΝΕΡΓΟ</span></div>
    <div className="plan-hero"><small>ΠΛΑΝΟ • ΒΙΤΑΜΙΝΕΣ</small><strong>Ενίσχυση βιταμίνης D</strong><p>Σκοπός: υποστήριξη ενέργειας και καθημερινής ευεξίας.</p></div>
    <PlanRow icon="✚" title="Βιταμίνη D3" text="1 φορά την ημέρα, μετά το κύριο γεύμα" />
    <PlanRow icon="◷" title="Καθημερινά • 30 ημέρες" text="Επόμενο check-in: 26 Ιουλίου" />
    <PlanRow icon="●" title="Υπενθύμιση ON" text="Ενεργοποιείται μόνο αν το επιλέξετε" />
    <button className="primary-action" onClick={() => setView("chat")}>Έχω απορία</button>
    <p className="safety-note">Το πλάνο προσαρμόζεται από τον φαρμακοποιό και δεν αποτελεί διάγνωση ή ιατρική συνταγογράφηση.</p>
  </div>;
}

function PlanRow({ icon, title, text }) { return <div className="plan-row"><span>{icon}</span><div><strong>{title}</strong><small>{text}</small></div></div>; }

function PatientProfile() { return <div className="screen fade-in"><span className="eyebrow">ΠΡΟΦΙΛ</span><h2>Μαρία Παπαδοπούλου</h2><div className="profile-card"><strong>Σύντομο προφίλ υγείας</strong><p>Ηλικία: 40–50 • Άσκηση: 2 φορές/εβδομάδα</p><p>Κάπνισμα: Όχι • Φάρμακα: Προαιρετικό</p></div><div className="profile-card pink"><strong>Απόρρητο & δεδομένα</strong><p>Πολιτική απορρήτου</p><p>Συναίνεση φωτογραφιών: Ενεργή</p><p>Αίτημα διαγραφής δεδομένων</p></div></div>; }

function PatientNav({ view, setView }) {
  const items = [["home", "⌂", "Αρχική"], ["chat", "●", "Chat"], ["timeline", "◉", "Η πορεία μου"], ["profile", "◇", "Προφίλ"]];
  return <nav className="patient-nav">{items.map(([key, icon, label]) => <button key={key} className={view === key ? "active" : ""} onClick={() => setView(key)}><b>{icon}</b><small>{label}</small></button>)}</nav>;
}

function PharmacyApp({ view, setView, messages, events, reaction, taskOpen, setTaskOpen, reply, setReply, sendMessage, notify }) {
  const reactionLabel = reaction ? reactionMeta[reaction] : null;
  return <section className="pro-app fade-in">
    <aside className="pro-sidebar">
      <div className="pro-logo"><span>✚</span><div><strong>FoxFollowUp</strong><small>by PharmaFox</small></div></div>
      <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>● Αρχική</button>
      <button className={view === "patient" ? "active" : ""} onClick={() => setView("patient")}>◉ Οι άνθρωποί μου</button>
      <button className={view === "inbox" ? "active" : ""} onClick={() => setView("inbox")}>✉ Inbox {taskOpen && <i>1</i>}</button>
      <button className={view === "protocols" ? "active" : ""} onClick={() => setView("protocols")}>▤ Πρωτόκολλα</button>
      <div className="pro-user"><span>Ζ</span><div><strong>Ζαχαρούλα</strong><small>Φαρμακοποιός</small></div></div>
    </aside>
    <div className="pro-main">
      <div className="pro-top"><div><small>FOXFOLLOWUP PROFESSIONAL</small><h2>{view === "dashboard" ? "Καλησπέρα, Ζαχαρούλα" : view === "inbox" ? "Επαγγελματικό Inbox" : view === "patient" ? "Μαρία Παπαδοπούλου" : "Βιβλιοθήκη πρωτοκόλλων"}</h2></div><button onClick={() => notify("Οι ειδοποιήσεις είναι ενημερωμένες")}>●</button></div>
      {view === "dashboard" && <Dashboard setView={setView} taskOpen={taskOpen} reactionLabel={reactionLabel} />}
      {view === "inbox" && <Inbox setView={setView} taskOpen={taskOpen} reactionLabel={reactionLabel} messages={messages} />}
      {view === "patient" && <PatientRecord events={events} messages={messages} reactionLabel={reactionLabel} setView={setView} setTaskOpen={setTaskOpen} reply={reply} setReply={setReply} sendMessage={sendMessage} />}
      {view === "protocols" && <Protocols setView={setView} notify={notify} />}
    </div>
  </section>;
}

function Dashboard({ setView, taskOpen, reactionLabel }) {
  return <div className="dashboard"><div className="metric-grid"><Metric title="Ενεργές παρακολουθήσεις" value="18" icon="◆"/><Metric title="Νέα μηνύματα" value={taskOpen ? "1" : "0"} icon="✉" alert={taskOpen}/><Metric title="Check-ins σήμερα" value="5" icon="✓"/><Metric title="Χρειάζονται προσοχή" value={taskOpen ? "1" : "0"} icon="!" alert={taskOpen}/></div>
    <div className="dashboard-grid"><section className="panel"><div className="panel-head"><div><h3>Προτεραιότητες</h3><small>Ό,τι χρειάζεται ενέργεια τώρα</small></div><span className={taskOpen ? "count-alert" : "count-ok"}>{taskOpen ? "1 ΑΝΟΙΧΤΟ" : "ΟΛΑ ΕΝΤΑΞΕΙ"}</span></div>{taskOpen ? <button className="priority" onClick={() => setView("inbox")}><span>!</span><div><strong>Μαρία Παπαδοπούλου</strong><small>{reactionLabel ? `${reactionLabel.emoji} Νέα ενημέρωση: ${reactionLabel.label}` : "Αναφορά ενόχλησης στο πλάνο βιταμίνης D"}</small></div><b>Τώρα →</b></button> : <div className="empty-state">✓ Δεν υπάρχουν ανοιχτές προτεραιότητες</div>}</section>
    <section className="panel"><div className="panel-head"><div><h3>Ενεργές παρακολουθήσεις</h3><small>Τελευταία δραστηριότητα</small></div></div><button className="person-row" onClick={() => setView("patient")}><span>Μ</span><div><strong>Μαρία Παπαδοπούλου</strong><small>Βιταμίνη D • check-in σήμερα</small></div><i>ΕΝΕΡΓΗ</i></button><button className="person-row"><span>Α</span><div><strong>Άννα Δημητρίου</strong><small>Περιποίηση δέρματος • φωτογραφία</small></div><i>ΝΕΟ</i></button></section></div>
  </div>;
}

function Metric({ title, value, icon, alert }) { return <div className={`metric ${alert ? "alert" : ""}`}><div><small>{title}</small><span>{icon}</span></div><strong>{value}</strong></div>; }

function Inbox({ setView, taskOpen, reactionLabel, messages }) {
  return <div className="inbox-layout"><section className="queue panel"><div className="panel-head"><div><h3>Ανοιχτές εργασίες</h3><small>Ταξινομημένες με βάση την ανάγκη</small></div></div>{taskOpen ? <button className="queue-item selected" onClick={() => setView("patient")}><span>!</span><div><strong>Μαρία Παπαδοπούλου</strong><small>{reactionLabel ? `${reactionLabel.emoji} ${reactionLabel.label} • απαιτεί απάντηση` : "Ενόχληση στο στομάχι • απαιτεί απάντηση"}</small></div><time>Τώρα</time></button> : <div className="empty-state">✓ Η εργασία ολοκληρώθηκε</div>}<button className="queue-item"><span>✉</span><div><strong>Γιώργος Κ.</strong><small>Νέο μήνυμα</small></div><time>8′</time></button></section>
    <section className="detail panel"><span className="eyebrow">ΕΠΙΛΕΓΜΕΝΗ ΕΡΓΑΣΙΑ</span><h3>Μαρία Παπαδοπούλου</h3><p className="quote">“{messages[messages.length - 1]?.text}”</p><div className="detail-meta"><span>Πλάνο</span><b>Βιταμίνη D</b><span>Κατάσταση</span><b>{reactionLabel ? `${reactionLabel.emoji} ${reactionLabel.label}` : "Χρειάζεται έλεγχο"}</b></div><button className="primary-action" onClick={() => setView("patient")}>Άνοιγμα φακέλου →</button></section>
  </div>;
}

function PatientRecord({ events, messages, reactionLabel, setView, setTaskOpen, reply, setReply, sendMessage }) {
  const respond = () => { sendMessage("pharmacy", reply); setTaskOpen(false); setReply(""); };
  return <div className="record"><div className="record-header"><span className="record-avatar">Μ</span><div><h3>Μαρία Παπαδοπούλου</h3><small>Verified mobile • Μέλος από 2026</small></div><button onClick={() => setView("protocols")}>＋ Νέα παρακολούθηση</button></div>
    <div className="record-tabs"><button className="active">Σύνοψη</button><button>Chat</button><button>Timeline</button><button>Πλάνο φροντίδας</button><button className="private">Σημειώσεις 🔒</button></div>
    <div className="record-grid"><section className="panel"><div className="panel-head"><div><h3>Ενεργό follow-up</h3><small>Βιταμίνη D • 12 Ιουλίου — 12 Αυγούστου</small></div><span className="count-ok">ΕΝΕΡΓΟ</span></div><div className="pro-timeline">{events.slice(-3).map((e, i) => <div key={i}><span>{e.icon}</span><div><small>{e.date}</small><strong>{e.title}</strong><p>{e.detail}</p></div></div>)}</div></section>
      <aside><section className="panel attention"><span className="eyebrow">ΧΡΕΙΑΖΕΤΑΙ ΕΛΕΓΧΟ</span><h3>{reactionLabel ? `${reactionLabel.emoji} ${reactionLabel.label}` : "Αναφορά ενόχλησης"}</h3><p>Τελευταίο μήνυμα: “{messages[messages.length - 1]?.text}”</p></section><section className="panel reply-box"><label>Απάντηση φαρμακοποιού</label><textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Γράψτε ή χρησιμοποιήστε voice-to-text…"/><div><button onClick={() => setReply("Καταγραφή μέσω voice-to-text — demo")}>● Voice</button><button className="send-reply" onClick={respond}>Αποστολή απάντησης</button></div></section><section className="panel private-note"><strong>🔒 Ιδιωτική σημείωση</strong><p>Ορατή μόνο στο φαρμακείο • voice-to-text διαθέσιμο.</p></section></aside>
    </div>
  </div>;
}

function Protocols({ setView, notify }) {
  const protocols = [["🌿", "Ενίσχυση βιταμίνης D", "Υγεία • 30 ημέρες • 3 check-ins", "v1.3"], ["🌸", "Ενυδάτωση & φροντίδα δέρματος", "Ομορφιά • 28 ημέρες • φωτογραφίες", "v2.1"], ["❧", "Μαγνήσιο & ύπνος", "Ευεξία • 14 ημέρες • 2 check-ins", "v1.0"], ["◆", "RESPIRATORY_01", "Αναπνευστικό • pilot template", "v0.1"]];
  return <div className="protocol-layout"><section className="panel protocol-list"><div className="panel-head"><div><h3>Πρωτόκολλα φροντίδας</h3><small>Έτοιμα, εκδόσεις και προσαρμογές</small></div><button onClick={() => notify("Νέο κενό πρωτόκολλο — demo")}>＋ Δημιουργία</button></div>{protocols.map((p, i) => <button className={i === 0 ? "protocol selected" : "protocol"} key={p[1]}><span>{p[0]}</span><div><strong>{p[1]}</strong><small>{p[2]}</small></div><i>{p[3]}</i></button>)}</section><section className="panel protocol-detail"><span className="eyebrow">ΕΠΙΛΕΓΜΕΝΟ ΠΡΩΤΟΚΟΛΛΟ</span><h3>Ενίσχυση βιταμίνης D</h3><p>Προσαρμόσιμο πλάνο που ορίζεται από τον φαρμακοποιό ανά άνθρωπο.</p><ul><li>Στόχος και διάρκεια</li><li>Οδηγίες λήψης</li><li>3 προγραμματισμένα check-ins</li><li>Quick reactions και Timeline</li></ul><button className="primary-action" onClick={() => { notify("Το πρωτόκολλο εφαρμόστηκε στη Μαρία — demo"); setView("patient"); }}>Χρήση σε νέα παρακολούθηση</button></section></div>;
}
