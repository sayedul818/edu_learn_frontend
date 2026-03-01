import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { classesAPI, groupsAPI, subjectsAPI, chaptersAPI, topicsAPI, examTypesAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { ChevronDown, ChevronRight, Trash2, Edit2 } from "lucide-react";

const AdminSections = () => {
  const { toast } = useToast();
  
  // Data states
  const [classes, setClasses] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [classDialog, setClassDialog] = useState(false);
  const [groupDialog, setGroupDialog] = useState(false);
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [chapterDialog, setChapterDialog] = useState(false);
  const [topicDialog, setTopicDialog] = useState(false);

  // Form states
  const [className, setClassName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [topicName, setTopicName] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");

  // Expanded state for tree view
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // Tab state
  const [activeTab, setActiveTab] = useState("academic");
  // Hierarchy reorder/view state
  const [levelView, setLevelView] = useState<"class" | "group" | "subject" | "chapter" | "topic" | null>(null);
  const [dragItems, setDragItems] = useState<any[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Exam Types states
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [examTypeDialog, setExamTypeDialog] = useState(false);
  const [examCategory, setExamCategory] = useState("Board");
  const [examName, setExamName] = useState("");
  const [examYear, setExamYear] = useState(new Date().getFullYear());
  const [editingExamTypeId, setEditingExamTypeId] = useState<string | null>(null);

  // Computed filtered lists based on selections
  const availableGroups = useMemo(() => {
    if (!selectedClassId) return [];
    const filtered = groups.filter(g => (g.classId?._id || g.classId) === selectedClassId);
    console.log(`🎯 useMemo: availableGroups for class ${selectedClassId}:`, filtered.length, filtered.map(g => g.name));
    return filtered.slice().sort((a,b)=>(a.order||0)-(b.order||0));
  }, [groups, selectedClassId]);

  const availableSubjects = useMemo(() => {
    if (!selectedGroupId) return [];
    return subjects.filter(s => (s.groupId?._id || s.groupId) === selectedGroupId).slice().sort((a,b)=>(a.order||0)-(b.order||0));
  }, [subjects, selectedGroupId]);

  const availableChapters = useMemo(() => {
    if (!selectedSubjectId) return [];
    return chapters.filter(ch => (ch.subjectId?._id || ch.subjectId) === selectedSubjectId).slice().sort((a,b)=>(a.order||0)-(b.order||0));
  }, [chapters, selectedSubjectId]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [classesRes, groupsRes, subjectsRes, chaptersRes, topicsRes, examTypesRes] = await Promise.all([
        classesAPI.getAll(),
        groupsAPI.getAll(),
        subjectsAPI.getAll(),
        chaptersAPI.getAll(),
        topicsAPI.getAll(),
        examTypesAPI.getAll().catch(err => {
          console.error('❌ Error loading exam types:', err);
          return { data: [], count: 0 };
        })
      ]);

      console.log('📚 Classes loaded:', classesRes.data?.length);
      console.log('📁 Groups loaded:', groupsRes.data?.length);
      console.log('📖 Subjects loaded:', subjectsRes.data?.length);
      console.log('📝 Chapters loaded:', chaptersRes.data?.length);
      console.log('🏷️ Topics loaded:', topicsRes.data?.length);
      console.log('📋 Exam Types loaded:', examTypesRes.data?.length || 0, '| Data:', examTypesRes.data);

      // Log group classIds to debug filtering
      if (groupsRes.data && groupsRes.data.length > 0) {
        groupsRes.data.forEach((g: any) => {
          console.log(`Group "${g.name}" - classId:`, g.classId, 'Type:', typeof g.classId, 'Is Object?', typeof g.classId === 'object');
        });
      }

      setClasses(classesRes.data || []);
      setGroups(groupsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setChapters(chaptersRes.data || []);
      setTopics(topicsRes.data || []);
      setExamTypes(examTypesRes.data || []);
      console.log('✅ ExamTypes state updated:', (examTypesRes.data || []).length, 'items');
    } catch (err) {
      console.error('Error loading data:', err);
      toast({ 
        title: "Failed to load data", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create handlers
  const createClass = async () => {
    if (!className.trim()) {
      toast({ title: "Enter class name", variant: "destructive" });
      return;
    }
    try {
      // Split by comma and trim each class name
      const classNames = className.split(',').map(c => c.trim()).filter(c => c.length > 0);
      
      if (classNames.length === 0) {
        toast({ title: "Please enter at least one class name", variant: "destructive" });
        return;
      }

      const createdClasses = [];
      
      // Create each class
      for (const name of classNames) {
        const response = await classesAPI.create({ name });
        createdClasses.push(response.data);
      }

      setClasses([...classes, ...createdClasses]);
      setClassName("");
      setClassDialog(false);
      toast({ title: `${createdClasses.length} class(es) created successfully!` });
    } catch (err) {
      toast({ 
        title: "Failed to create class", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const createGroup = async () => {
    console.log('🔍 Creating Group(s) - Name:', groupName, 'ClassID:', selectedClassId);
    if (!groupName.trim() || !selectedClassId) {
      toast({ title: "Fill all fields", variant: "destructive" });
      console.log('❌ Validation failed - missing fields');
      return;
    }
    try {
      // Split by comma and trim each group name
      const groupNames = groupName.split(',').map(g => g.trim()).filter(g => g.length > 0);
      
      if (groupNames.length === 0) {
        toast({ title: "Please enter at least one group name", variant: "destructive" });
        return;
      }

      const createdGroups = [];
      
      // Create each group
      for (const name of groupNames) {
        console.log('📤 Sending API request:', { name, classId: selectedClassId });
        const response = await groupsAPI.create({ name, classId: selectedClassId });
        console.log('✅ Group created:', response.data);
        createdGroups.push(response.data);
      }

      setGroups([...groups, ...createdGroups]);
      setGroupName("");
      setSelectedClassId("");
      setGroupDialog(false);
      toast({ title: `${createdGroups.length} group(s) created successfully!` });
    } catch (err) {
      console.error('❌ Error creating group:', err);
      toast({ 
        title: "Failed to create group", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const createSubject = async () => {
    console.log('🔍 Creating Subject(s) - Name:', subjectName, 'GroupID:', selectedGroupId);
    if (!subjectName.trim() || !selectedGroupId) {
      toast({ title: "Fill all fields", variant: "destructive" });
      console.log('❌ Validation failed - missing fields');
      return;
    }
    try {
      // Split by comma and trim each subject name
      const subjectNames = subjectName.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      if (subjectNames.length === 0) {
        toast({ title: "Please enter at least one subject name", variant: "destructive" });
        return;
      }

      const createdSubjects = [];
      
      // Create each subject
      for (const name of subjectNames) {
        console.log('📤 Sending API request:', { name, groupId: selectedGroupId });
        const response = await subjectsAPI.create({ name, groupId: selectedGroupId });
        console.log('✅ Subject created:', response.data);
        createdSubjects.push(response.data);
      }

      setSubjects([...subjects, ...createdSubjects]);
      setSubjectName("");
      setSelectedGroupId("");
      setSubjectDialog(false);
      toast({ title: `${createdSubjects.length} subject(s) created successfully!` });
    } catch (err) {
      console.error('❌ Error creating subject:', err);
      toast({ 
        title: "Failed to create subject", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const createChapter = async () => {
    console.log('🔍 Creating Chapter(s) - Name:', chapterName, 'SubjectID:', selectedSubjectId);
    if (!chapterName.trim() || !selectedSubjectId) {
      toast({ title: "Fill all fields", variant: "destructive" });
      console.log('❌ Validation failed - missing fields');
      return;
    }
    try {
      // Split by comma and trim each chapter name
      const chapterNames = chapterName.split(',').map(c => c.trim()).filter(c => c.length > 0);
      
      if (chapterNames.length === 0) {
        toast({ title: "Please enter at least one chapter name", variant: "destructive" });
        return;
      }

      const createdChapters = [];
      
      // Create each chapter
      for (const name of chapterNames) {
        console.log('📤 Sending API request:', { name, subjectId: selectedSubjectId });
        const response = await chaptersAPI.create({ name, subjectId: selectedSubjectId });
        console.log('✅ Chapter created:', response.data);
        createdChapters.push(response.data);
      }

      setChapters([...chapters, ...createdChapters]);
      setChapterName("");
      setSelectedSubjectId("");
      setChapterDialog(false);
      toast({ title: `${createdChapters.length} chapter(s) created successfully!` });
    } catch (err) {
      console.error('❌ Error creating chapter:', err);
      toast({ 
        title: "Failed to create chapter", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const createTopic = async () => {
    console.log('🔍 Creating Topic(s) - Name:', topicName, 'ChapterID:', selectedChapterId);
    if (!topicName.trim() || !selectedChapterId) {
      toast({ title: "Fill all fields", variant: "destructive" });
      console.log('❌ Validation failed - missing fields');
      return;
    }
    try {
      // Split by comma and trim each topic name
      const topicNames = topicName.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      if (topicNames.length === 0) {
        toast({ title: "Please enter at least one topic name", variant: "destructive" });
        return;
      }

      const createdTopics = [];
      
      // Create each topic
      for (const name of topicNames) {
        console.log('📤 Sending API request:', { name, chapterId: selectedChapterId });
        const response = await topicsAPI.create({ name, chapterId: selectedChapterId });
        console.log('✅ Topic created:', response.data);
        createdTopics.push(response.data);
      }

      setTopics([...topics, ...createdTopics]);
      setTopicName("");
      setSelectedChapterId("");
      setTopicDialog(false);
      toast({ title: `${createdTopics.length} topic(s) created successfully!` });
    } catch (err) {
      console.error('❌ Error creating topic:', err);
      toast({ 
        title: "Failed to create topic", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  // Toggle expand/collapse
  const toggleClass = (id: string) => {
    const newSet = new Set(expandedClasses);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedClasses(newSet);
  };

  const toggleGroup = (id: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedGroups(newSet);
  };

  const toggleSubject = (id: string) => {
    const newSet = new Set(expandedSubjects);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedSubjects(newSet);
  };

  const toggleChapter = (id: string) => {
    const newSet = new Set(expandedChapters);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedChapters(newSet);
  };

  // Delete handlers
  const deleteClass = async (id: string, name: string) => {
    if (!confirm(`Delete class "${name}"? This will delete all its groups, subjects, chapters, and topics!`)) return;
    try {
      await classesAPI.delete(id);
      setClasses(classes.filter(c => c._id !== id));
      toast({ title: "Class deleted" });
    } catch (err) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const deleteGroup = async (id: string, name: string) => {
    if (!confirm(`Delete group "${name}"?`)) return;
    try {
      await groupsAPI.delete(id);
      setGroups(groups.filter(g => g._id !== id));
      toast({ title: "Group deleted" });
    } catch (err) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const deleteSubject = async (id: string, name: string) => {
    if (!confirm(`Delete subject "${name}"?`)) return;
    try {
      await subjectsAPI.delete(id);
      setSubjects(subjects.filter(s => s._id !== id));
      toast({ title: "Subject deleted" });
    } catch (err) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const deleteChapter = async (id: string, name: string) => {
    if (!confirm(`Delete chapter "${name}"?`)) return;
    try {
      await chaptersAPI.delete(id);
      setChapters(chapters.filter(ch => ch._id !== id));
      toast({ title: "Chapter deleted" });
    } catch (err) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const deleteTopic = async (id: string, name: string) => {
    if (!confirm(`Delete topic "${name}"?`)) return;
    try {
      await topicsAPI.delete(id);
      setTopics(topics.filter(t => t._id !== id));
      toast({ title: "Topic deleted" });
    } catch (err) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  // Exam Type handlers
  const createOrUpdateExamType = async () => {
    if (!examName.trim()) {
      toast({ title: "Enter exam name", variant: "destructive" });
      return;
    }
    try {
      if (editingExamTypeId) {
        // Update existing
        const response = await examTypesAPI.update(editingExamTypeId, {
          examCategory,
          examName,
          year: examYear,
        });
        setExamTypes(examTypes.map(et => et._id === editingExamTypeId ? response.data : et));
        toast({ title: "Exam type updated successfully!" });
      } else {
        // Create new
        const response = await examTypesAPI.create({
          examCategory,
          examName,
          year: examYear,
        });
        setExamTypes([...examTypes, response.data]);
        toast({ title: "Exam type created successfully!" });
      }
      setExamName("");
      setExamCategory("Board");
      setExamYear(new Date().getFullYear());
      setExamTypeDialog(false);
      setEditingExamTypeId(null);
    } catch (err) {
      console.error('❌ Error:', err);
      toast({ 
        title: editingExamTypeId ? "Failed to update exam type" : "Failed to create exam type", 
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const editExamType = (examType: any) => {
    setEditingExamTypeId(examType._id);
    setExamCategory(examType.examCategory);
    setExamName(examType.examName);
    setExamYear(examType.year);
    setExamTypeDialog(true);
  };

  const deleteExamType = async (id: string, name: string) => {
    if (!confirm(`Delete exam type "${name}"?`)) return;
    try {
      await examTypesAPI.delete(id);
      setExamTypes(examTypes.filter(et => et._id !== id));
      toast({ title: "Exam type deleted" });
    } catch (err) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const resetExamTypeForm = () => {
    setExamName("");
    setExamCategory("Board");
    setExamYear(new Date().getFullYear());
    setEditingExamTypeId(null);
    setExamTypeDialog(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Sections Management</h1>
        <p className="text-muted-foreground mt-1">Create and manage educational hierarchy and exam types</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("academic")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "academic"
              ? "border-b-2 border-success text-success"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Academic Structure
        </button>
        <button
          onClick={() => setActiveTab("exam-types")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "exam-types"
              ? "border-b-2 border-success text-success"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Exam Types
        </button>
      </div>

      {/* Academic Structure Tab */}
      {activeTab === "academic" && (
        <>
      {/* Action Buttons + Hierarchy in responsive columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <Button className="w-full sm:w-auto" onClick={() => setClassDialog(true)}>+ Add Class</Button>
            <Button className="w-full sm:w-auto" onClick={() => setGroupDialog(true)} variant="outline">+ Add Group</Button>
            <Button className="w-full sm:w-auto" onClick={() => setSubjectDialog(true)} variant="outline">+ Add Subject</Button>
            <Button className="w-full sm:w-auto" onClick={() => setChapterDialog(true)} variant="outline">+ Add Chapter</Button>
            <Button className="w-full sm:w-auto" onClick={() => setTopicDialog(true)} variant="outline">+ Add Topic</Button>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchical Tree View */}
      <Card>
        <CardHeader>
          <CardTitle>Sections Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <BeautifulLoader message="Loading..." compact />
          ) : classes.length === 0 ? (
            <p className="text-muted-foreground">No classes yet. Click "Add Class" to start.</p>
          ) : (
            <div className="space-y-4">
              {/* Level controls */}
              <div className="flex items-center gap-2">
                <Button size="sm" variant={levelView === null ? "default" : "outline"} onClick={() => { setLevelView(null); }}>Tree View</Button>
                <Button size="sm" variant={levelView === 'class' ? 'default' : 'outline'} onClick={() => { setLevelView('class'); setDragItems([...classes].sort((a,b)=> (a.order||0)-(b.order||0))); }}>Class Level</Button>
                <Button size="sm" variant={levelView === 'group' ? 'default' : 'outline'} onClick={() => {
                  if (!selectedClassId) { toast({ title: 'একটি ক্লাস নির্বাচন করুন', description: 'প্রথমে ক্লাস সিলেক্ট করুন', variant: 'destructive' }); return; }
                  const list = groups.filter(g => (g.classId?._id || g.classId) === selectedClassId).slice().sort((a,b)=> (a.order||0)-(b.order||0));
                  setDragItems(list);
                  setLevelView('group');
                }}>Group Level</Button>
                <Button size="sm" variant={levelView === 'subject' ? 'default' : 'outline'} onClick={() => {
                  if (!selectedGroupId) { toast({ title: 'একটি গ্রুপ নির্বাচন করুন', description: 'প্রথমে গ্রুপ খুলুন', variant: 'destructive' }); return; }
                  const list = subjects.filter(s => (s.groupId?._id || s.groupId) === selectedGroupId).slice().sort((a,b)=> (a.order||0)-(b.order||0));
                  setDragItems(list);
                  setLevelView('subject');
                }}>Subject Level</Button>
                <Button size="sm" variant={levelView === 'chapter' ? 'default' : 'outline'} onClick={() => {
                  if (!selectedSubjectId) { toast({ title: 'একটি বিষয় নির্বাচন করুন', description: 'প্রথমে বিষয় খুলুন', variant: 'destructive' }); return; }
                  const list = chapters.filter(c => (c.subjectId?._id || c.subjectId) === selectedSubjectId).slice().sort((a,b)=> (a.order||0)-(b.order||0));
                  setDragItems(list);
                  setLevelView('chapter');
                }}>Chapter Level</Button>
                <Button size="sm" variant={levelView === 'topic' ? 'default' : 'outline'} onClick={() => {
                  if (!selectedChapterId) { toast({ title: 'একটি অধ্যায় নির্বাচন করুন', description: 'প্রথমে অধ্যায় খুলুন', variant: 'destructive' }); return; }
                  const list = topics.filter(t => (t.chapterId?._id || t.chapterId) === selectedChapterId).slice().sort((a,b)=> (a.order||0)-(b.order||0));
                  setDragItems(list);
                  setLevelView('topic');
                }}>Topic Level</Button>
              </div>

              {/* Reorder panel */}
              {levelView && (
                <div className="mt-3 border rounded-lg p-3 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{levelView === 'class' ? 'Class Level' : levelView === 'group' ? `Class: ${classes.find(c=>c._id===selectedClassId)?.name || ''}` : levelView === 'subject' ? `Group: ${groups.find(g=>g._id===selectedGroupId)?.name || ''}` : levelView === 'chapter' ? `Subject: ${subjects.find(s=>s._id===selectedSubjectId)?.name || ''}` : `Chapter: ${chapters.find(ch=>ch._id===selectedChapterId)?.name || ''}`}</div>
                    <div className="flex items-center gap-2">
                      {levelView !== 'class' && <Button size="sm" variant="outline" onClick={() => { // back
                        if (levelView === 'group') { setLevelView('class'); setDragItems([...classes].sort((a,b)=> (a.order||0)-(b.order||0))); }
                        if (levelView === 'subject') { setLevelView('group'); const list = groups.filter(g => (g.classId?._id || g.classId) === selectedClassId).slice().sort((a,b)=> (a.order||0)-(b.order||0)); setDragItems(list); }
                        if (levelView === 'chapter') { setLevelView('subject'); const list = subjects.filter(s => (s.groupId?._id || s.groupId) === selectedGroupId).slice().sort((a,b)=> (a.order||0)-(b.order||0)); setDragItems(list); }
                        if (levelView === 'topic') { setLevelView('chapter'); const list = chapters.filter(c => (c.subjectId?._id || c.subjectId) === selectedSubjectId).slice().sort((a,b)=> (a.order||0)-(b.order||0)); setDragItems(list); }
                      }}>পিছনে যান</Button>}
                      <Button size="sm" onClick={async () => {
                        // save order
                        try {
                          const promises: Promise<any>[] = [];
                          for (let i = 0; i < dragItems.length; i++) {
                            const item = dragItems[i];
                            const id = item._id;
                            const payload = { order: i };
                            if (levelView === 'class') promises.push(classesAPI.update(id, payload));
                            if (levelView === 'group') promises.push(groupsAPI.update(id, payload));
                            if (levelView === 'subject') promises.push(subjectsAPI.update(id, payload));
                            if (levelView === 'chapter') promises.push(chaptersAPI.update(id, payload));
                            if (levelView === 'topic') promises.push(topicsAPI.update(id, payload));
                          }
                          await Promise.all(promises);
                          toast({ title: 'অর্ডার সংরক্ষণ করা হয়েছে' });
                          // reload data
                          await loadAllData();
                          setLevelView(null);
                        } catch (err) {
                          console.error('Failed to save order', err);
                          toast({ title: 'Failed to save order', variant: 'destructive' });
                        }
                      }}>অর্ডার সংরক্ষণ করুন</Button>
                    </div>
                  </div>

                  <div>
                    <ul className="space-y-2">
                      {dragItems.map((it, idx) => (
                        <li key={it._id}
                          draggable
                          onDragStart={(e) => { setDraggingIndex(idx); e.dataTransfer?.setData('text/plain', String(idx)); }}
                          onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx); }}
                          onDragEnd={() => { setDraggingIndex(null); setDragOverIndex(null); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const from = draggingIndex ?? parseInt(e.dataTransfer.getData('text/plain'));
                            const to = idx;
                            if (from === to) return;
                            const newArr = [...dragItems];
                            const [moved] = newArr.splice(from, 1);
                            newArr.splice(to, 0, moved);
                            setDragItems(newArr);
                            setDraggingIndex(null);
                            setDragOverIndex(null);
                          }}
                          className={`p-3 rounded-lg border ${dragOverIndex === idx ? 'border-success bg-success/5' : 'border-border bg-card'} flex items-center justify-between`}
                        >
                          <span className="flex items-center gap-3"><span className="p-2 rounded bg-muted/20">☰</span> <span>{it.name || it.title}</span></span>
                          <div className="text-xs text-muted-foreground">#{idx+1}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {classes.slice().sort((a,b)=>(a.order||0)-(b.order||0)).map((cls) => {
                  const classGroups = groups.filter(g => {
                    const gClassId = g.classId?._id || g.classId;
                    const matches = gClassId === cls._id;
                    if (!matches) {
                      console.log(`🔍 Tree view: Group "${g.name}" classId=${gClassId} doesn't match class "${cls.name}" id=${cls._id}`);
                    }
                    return matches;
                  });
                  console.log(`🌳 Tree view: Class "${cls.name}" (${cls._id}) has ${classGroups.length} groups`);
                  const isExpanded = expandedClasses.has(cls._id);

                  return (
                    <div key={cls._id} className="border border-border rounded-lg">
                      {/* Class Level */}
                      <div className="flex items-center justify-between p-3 bg-primary/5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleClass(cls._id)} className="hover:bg-accent p-1 rounded">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          <span onClick={() => { setSelectedClassId(cls._id); const list = groups.filter(g=> (g.classId?._id||g.classId)===cls._id).slice().sort((a,b)=>(a.order||0)-(b.order||0)); setDragItems(list); setLevelView('group'); }} className="font-semibold cursor-pointer">📚 {cls.name}</span>
                          <span className="text-xs text-muted-foreground">({classGroups.length} groups)</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => deleteClass(cls._id, cls.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Groups Level */}
                      {isExpanded && (
                        <div className="pl-6 py-2">
                          {classGroups.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-2">No groups yet</p>
                          ) : (
                            classGroups.map((grp) => {
                              const groupSubjects = subjects.filter(s => (s.groupId?._id || s.groupId) === grp._id);
                              const isGrpExpanded = expandedGroups.has(grp._id);

                              return (
                                <div key={grp._id} className="mb-2 border-l-2 border-primary/20">
                                  <div className="flex items-center justify-between p-2 hover:bg-accent rounded-r">
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => toggleGroup(grp._id)} className="hover:bg-accent p-1 rounded">
                                        {isGrpExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                      </button>
                                      <span onClick={() => { setSelectedGroupId(grp._id); const list = subjects.filter(s => (s.groupId?._id||s.groupId)===grp._id).slice().sort((a,b)=>(a.order||0)-(b.order||0)); setDragItems(list); setLevelView('subject'); }} className="font-medium cursor-pointer">📁 {grp.name}</span>
                                      <span className="text-xs text-muted-foreground">({groupSubjects.length} subjects)</span>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => deleteGroup(grp._id, grp.name)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  {/* Subjects Level */}
                                  {isGrpExpanded && (
                                    <div className="pl-6 py-1">
                                      {groupSubjects.length === 0 ? (
                                        <p className="text-xs text-muted-foreground p-2">No subjects yet</p>
                                      ) : (
                                        groupSubjects.map((subj) => {
                                          const subjChapters = chapters.filter(ch => (ch.subjectId?._id || ch.subjectId) === subj._id);
                                          const isSubjExpanded = expandedSubjects.has(subj._id);
                                          return (
                                            <div key={subj._id} className="mb-2 border-l-2 border-primary/20">
                                              <div className="flex items-center justify-between p-2 hover:bg-accent rounded-r">
                                                <div className="flex items-center gap-2">
                                                  <button onClick={() => toggleSubject(subj._id)} className="hover:bg-accent p-1 rounded">
                                                    {isSubjExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                  </button>
                                                  <span onClick={() => { setSelectedSubjectId(subj._id); const list = chapters.filter(ch => (ch.subjectId?._id||ch.subjectId)===subj._id).slice().sort((a,b)=>(a.order||0)-(b.order||0)); setDragItems(list); setLevelView('chapter'); }} className="text-sm cursor-pointer">📖 {subj.name}</span>
                                                  <span className="text-xs text-muted-foreground">({subjChapters.length} chapters)</span>
                                                </div>
                                                <Button size="sm" variant="ghost" onClick={() => deleteSubject(subj._id, subj.name)}>
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>

                                              {/* Chapters Level */}
                                              {isSubjExpanded && (
                                                <div className="pl-6 py-1">
                                                  {subjChapters.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground p-2">No chapters yet</p>
                                                  ) : (
                                                    subjChapters.map((ch) => {
                                                      const chTopics = topics.filter(t => (t.chapterId?._id || t.chapterId) === ch._id);
                                                      const isChExpanded = expandedChapters.has(ch._id);

                                                      return (
                                                        <div key={ch._id} className="mb-1 border-l-2 border-primary/20">
                                                          <div className="flex items-center justify-between p-2 hover:bg-accent rounded-r">
                                                            <div className="flex items-center gap-2">
                                                              <button onClick={() => toggleChapter(ch._id)} className="hover:bg-accent p-1 rounded">
                                                                {isChExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                              </button>
                                                              <span onClick={() => { setSelectedChapterId(ch._id); const list = topics.filter(t => (t.chapterId?._id||t.chapterId)===ch._id).slice().sort((a,b)=>(a.order||0)-(b.order||0)); setDragItems(list); setLevelView('topic'); }} className="text-sm cursor-pointer">📝 {ch.name}</span>
                                                              <span className="text-xs text-muted-foreground">({chTopics.length} topics)</span>
                                                            </div>
                                                            <Button size="sm" variant="ghost" onClick={() => deleteChapter(ch._id, ch.name)}>
                                                              <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                          </div>

                                                          {/* Topics Level */}
                                                          {isChExpanded && (
                                                            <div className="pl-6 py-1">
                                                              {chTopics.length === 0 ? (
                                                                <p className="text-xs text-muted-foreground p-1">No topics yet</p>
                                                              ) : (
                                                                chTopics.map((topic) => (
                                                                  <div key={topic._id} className="flex items-center justify-between p-1 hover:bg-accent rounded text-sm">
                                                                    <span>🏷️ {topic.name}</span>
                                                                    <Button size="sm" variant="ghost" onClick={() => deleteTopic(topic._id, topic.name)}>
                                                                      <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                  </div>
                                                                ))
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                      );
                                                    })
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
        </>
      )}

      {/* Exam Types Tab */}
      {activeTab === "exam-types" && (
        <>
      {/* Exam Type Creation Form + List in responsive columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Exam Type</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <BeautifulLoader message="Loading exam types..." compact className="mb-4" />}
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Category *</Label>
                <select 
                  value={examCategory} 
                  onChange={(e) => setExamCategory(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Board">Board</option>
                  <option value="Admission">Admission</option>
                  <option value="Institution">Institution</option>
                  <option value="Practice">Practice</option>
                </select>
              </div>

              <div>
                <Label>Name *</Label>
                <Input 
                  placeholder="e.g., Dhaka, Medical, BUET" 
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Year *</Label>
                <Input 
                  type="number" 
                  placeholder="e.g., 2023"
                  value={examYear}
                  onChange={(e) => setExamYear(parseInt(e.target.value))}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={createOrUpdateExamType} className="w-full sm:w-auto bg-success hover:bg-success/90">
                {editingExamTypeId ? "Update Exam Type" : "Create Exam Type"}
              </Button>
              {editingExamTypeId && (
                <Button onClick={resetExamTypeForm} variant="ghost" className="w-full sm:w-auto">
                  Cancel Edit
                </Button>
              )}
              <div className="sm:ml-auto">
                <Button onClick={loadAllData} variant="outline">
                  🔄 Refresh
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Exam Types List */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Types List</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Total: {loading ? "Loading..." : examTypes.length} exam types</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <BeautifulLoader message="Loading exam types..." compact className="py-8" />
          ) : examTypes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No exam types created yet. Create one to get started!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Year</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {examTypes.map((et, idx) => (
                    <tr key={et._id} className={idx % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                          {et.examCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{et.examName}</td>
                      <td className="py-3 px-4">{et.year}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => editExamType(et)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteExamType(et._id, `${et.examCategory} - ${et.examName} - ${et.year}`)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
        </>
      )}

      {/* Add Class Dialog */}
      <Dialog open={classDialog} onOpenChange={setClassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Class Name</Label>
              <Input 
                placeholder="e.g., HSC, SSC, Class 10" 
                value={className} 
                onChange={(e) => setClassName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setClassDialog(false)}>Cancel</Button>
              <Button onClick={createClass}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Group Dialog */}
      <Dialog open={groupDialog} onOpenChange={setGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Class</Label>
              <select 
                value={selectedClassId} 
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">-- Select Class --</option>
                {classes.slice().sort((a,b)=>(a.order||0)-(b.order||0)).map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Group Name</Label>
              <Input 
                placeholder="e.g., Science, Arts, Commerce" 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setGroupDialog(false)}>Cancel</Button>
              <Button onClick={createGroup}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Subject Dialog */}
      <Dialog open={subjectDialog} onOpenChange={setSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Class</Label>
              <select 
                value={selectedClassId} 
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedGroupId("");
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">-- Select Class --</option>
                {classes.slice().sort((a,b)=>(a.order||0)-(b.order||0)).map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Select Group</Label>
              <select 
                value={selectedGroupId} 
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                disabled={!selectedClassId}
              >
                <option value="">-- Select Group --</option>
                {availableGroups.map(g => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Subject Name</Label>
              <Input 
                placeholder="e.g., Physics, Chemistry, Biology" 
                value={subjectName} 
                onChange={(e) => setSubjectName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSubjectDialog(false)}>Cancel</Button>
              <Button onClick={createSubject}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Chapter Dialog */}
      <Dialog open={chapterDialog} onOpenChange={setChapterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Class</Label>
              <select 
                value={selectedClassId} 
                onChange={(e) => {
                  console.log('📚 Class selected:', e.target.value);
                  console.log('📚 Available groups:', groups.length);
                  setSelectedClassId(e.target.value);
                  setSelectedGroupId("");
                  setSelectedSubjectId("");
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">-- Select Class --</option>
                {classes.slice().sort((a,b)=>(a.order||0)-(b.order||0)).map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Select Group</Label>
              <select 
                value={selectedGroupId} 
                onChange={(e) => {
                  console.log('📁 Group selected:', e.target.value);
                  setSelectedGroupId(e.target.value);
                  setSelectedSubjectId("");
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                disabled={!selectedClassId}
              >
                <option value="">-- Select Group --</option>
                {availableGroups.map(g => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
              {selectedClassId && availableGroups.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No groups found for this class</p>
              )}
            </div>
            <div>
              <Label>Select Subject</Label>
              <select 
                value={selectedSubjectId} 
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                disabled={!selectedGroupId}
              >
                <option value="">-- Select Subject --</option>
                {availableSubjects.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Chapter Name</Label>
              <Input 
                placeholder="e.g., Thermodynamics, Organic Chemistry" 
                value={chapterName} 
                onChange={(e) => setChapterName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setChapterDialog(false)}>Cancel</Button>
              <Button onClick={createChapter}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Topic Dialog */}
      <Dialog open={topicDialog} onOpenChange={setTopicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Class</Label>
              <select 
                value={selectedClassId} 
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedGroupId("");
                  setSelectedSubjectId("");
                  setSelectedChapterId("");
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">-- Select Class --</option>
                {classes.slice().sort((a,b)=>(a.order||0)-(b.order||0)).map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <Label>Select Group</Label>
              <select 
                value={selectedGroupId} 
                onChange={(e) => {
                  setSelectedGroupId(e.target.value);
                  setSelectedSubjectId("");
                  setSelectedChapterId("");
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                disabled={!selectedClassId}
              >
                <option value="">-- Select Group --</option>
                {availableGroups.map(g => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Select Subject</Label>
              <select 
                value={selectedSubjectId} 
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedChapterId("");
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                disabled={!selectedGroupId}
              >
                <option value="">-- Select Subject --</option>
                {availableSubjects.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Select Chapter</Label>
              <select 
                value={selectedChapterId} 
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                disabled={!selectedSubjectId}
              >
                <option value="">-- Select Chapter --</option>
                {availableChapters.map(ch => (
                  <option key={ch._id} value={ch._id}>{ch.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Topic Name</Label>
              <Input 
                placeholder="e.g., Laws of Thermodynamics, Alkanes" 
                value={topicName} 
                onChange={(e) => setTopicName(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setTopicDialog(false)}>Cancel</Button>
              <Button onClick={createTopic}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exam Type Dialog */}
      <Dialog open={examTypeDialog} onOpenChange={setExamTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExamTypeId ? "Edit Exam Type" : "Create New Exam Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category *</Label>
              <select 
                value={examCategory} 
                onChange={(e) => setExamCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 mt-2"
              >
                <option value="Board">Board</option>
                <option value="Admission">Admission</option>
                <option value="Institution">Institution</option>
                <option value="Practice">Practice</option>
              </select>
            </div>
            <div>
              <Label>Name *</Label>
              <Input 
                placeholder="e.g., Dhaka, Medical, BUET" 
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
              />
            </div>
            <div>
              <Label>Year *</Label>
              <Input 
                type="number" 
                placeholder="e.g., 2023"
                value={examYear}
                onChange={(e) => setExamYear(parseInt(e.target.value))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => resetExamTypeForm()}>Cancel</Button>
              <Button onClick={createOrUpdateExamType}>{editingExamTypeId ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>    </div>
  );
};

export default AdminSections;