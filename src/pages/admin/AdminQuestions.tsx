import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { classesAPI, groupsAPI, subjectsAPI, chaptersAPI, questionsAPI } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, BookOpen, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const AdminQuestions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Database data
  const [classes, setClasses] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  // Load all data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesRes, groupsRes, subjectsRes, chaptersRes] = await Promise.all([
        classesAPI.getAll(),
        groupsAPI.getAll(),
        subjectsAPI.getAll(),
        chaptersAPI.getAll()
      ]);

      console.log('📚 Loaded Classes:', classesRes.data);
      console.log('📁 Loaded Groups:', groupsRes.data);
      console.log('📖 Loaded Subjects:', subjectsRes.data);
      console.log('📝 Loaded Chapters:', chaptersRes.data);

      setClasses(classesRes.data || []);
      setGroups(groupsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setChapters(chaptersRes.data || []);

      // Auto-select first class and group
      if (classesRes.data?.length > 0) {
        const firstClass = classesRes.data[0];
        setSelectedClassId(firstClass._id);

        const firstClassGroups = (groupsRes.data || []).filter((g: any) => (g.classId?._id || g.classId) === firstClass._id);
        console.log('🎯 Groups for first class:', firstClassGroups);
        if (firstClassGroups.length > 0) {
          setSelectedGroupId(firstClassGroups[0]._id);
        } else {
          console.warn('⚠️ No groups found for class:', firstClass.name);
        }
      }
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

  // Filter groups by selected class
  const availableGroups = groups.filter(g => (g.classId?._id || g.classId) === selectedClassId);

  // Filter subjects by selected group
  const availableSubjects = subjects.filter(s => (s.groupId?._id || s.groupId) === selectedGroupId);

  const toggleSubject = (id: string) => setExpandedSubject(expandedSubject === id ? null : id);

  const handleChapterClick = (subjectId: string, chapterId: string) => {
    navigate(`/admin/questions/${subjectId}/${chapterId}`);
  };

  // Get chapters for a specific subject
  const getChaptersForSubject = (subjectId: string) => {
    return chapters.filter(ch => (ch.subjectId?._id || ch.subjectId) === subjectId);
  };

  const [choiceOpen, setChoiceOpen] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [parsingError, setParsingError] = useState<string | null>(null);

  const handleCreateGlobal = () => navigate(`/teacher/create-question`);

  const handleImportJson = async () => {
    setParsingError(null);
    try {
      const parsed = JSON.parse(jsonText);
      const items: any[] = Array.isArray(parsed) ? parsed : parsed.questions || (parsed.items || []);
      if (!Array.isArray(items)) throw new Error("Expected an array of questions or an object with a 'questions' array");

      let added = 0;
      const errors: string[] = [];

      for (const it of items) {
        try {
          if (!it) continue;
          // Check for either old or new field names
          if (!it.questionBn && !it.questionText && !it.questionTextBn && !it.questionTextEn) continue;
          if ((!it.options && !it.opts && !it.choices) || (Array.isArray(it.options) && it.options.length < 2)) {
            errors.push(`Question: Must have at least 2 options`);
            continue;
          }
          if (!it.subjectId && !it.chapterId && !it.topicId) {
            errors.push(`Question: Must have subjectId, chapterId, and topicId`);
            continue;
          }

          // Prepare payload for database - using backend field names
          const payload = {
            questionTextEn: it.questionTextEn || it.questionText || it.questionBn || "",
            questionTextBn: it.questionTextBn || it.questionBn || it.questionText || "",
            options: it.options || it.opts || it.choices || [],
            correctAnswer: it.correctAnswer || it.answer || it.correct || "",
            explanation: it.explanation || it.explain || "",
            subjectId: it.subjectId,
            chapterId: it.chapterId,
            topicId: it.topicId,
            difficulty: (it.difficulty || "medium").toLowerCase(),
            tags: it.tags || [],
          };

          // Create question in database
          const response = await questionsAPI.create(payload);
          console.log('✅ Question imported:', response.data._id);
          added++;
        } catch (itemErr) {
          console.error('⚠️ Error importing single question:', itemErr);
          errors.push(`Question ${added + 1}: ${itemErr instanceof Error ? itemErr.message : 'Unknown error'}`);
        }
      }

      setJsonOpen(false);
      setChoiceOpen(false);
      setJsonText("");
      
      const message = added > 0 
        ? `Successfully imported ${added} questions to database!`
        : "No questions were imported";
      
      toast({ 
        title: "Import complete", 
        description: errors.length > 0 ? `${message}. ${errors.length} errors occurred.` : message 
      });
      
      // Reload data
      await loadData();
    } catch (e: any) {
      setParsingError(e?.message || String(e));
    }
  };

  return (
    <div className="space-y-6 font-bangla">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Question Bank (Admin)</h1>
          <p className="text-muted-foreground mt-1">Browse subjects and manage questions — create or edit from here</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={choiceOpen} onOpenChange={setChoiceOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setChoiceOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" /> Create Question
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose input method</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Create a single question using the form, or import multiple questions using JSON.</p>
                <div className="flex gap-2">
                  <Button onClick={() => { setChoiceOpen(false); handleCreateGlobal(); }}>Use Form</Button>
                  <Button variant="outline" onClick={() => { setJsonOpen(true); }}>Import JSON</Button>
                </div>
                <p className="text-xs text-muted-foreground">Tip: For DB import later, use an array of question objects. Each object should include `questionBn` or `questionText`, and optional `options`, `correctAnswer`, `subjectId`, `chapterId`.</p>
              </div>
            </DialogContent>
          </Dialog>

          {/* JSON Import Dialog */}
          <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Questions via JSON</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Paste a JSON array of questions, or an object with a `questions` array.</p>
                <Textarea className="h-36 resize-y" value={jsonText} onChange={(e:any) => setJsonText(e.target.value)} placeholder='[ { "questionBn": "...", "options": ["a","b"], "correctAnswer": "a" }, ... ]' />
                {parsingError && <p className="text-sm text-destructive">{parsingError}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setJsonOpen(false)}>Cancel</Button>
                  <Button onClick={handleImportJson}>Import</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading data from database...</p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedClassId}
              onChange={(e) => {
                const newClassId = e.target.value;
                setSelectedClassId(newClassId);
                const newGroups = groups.filter(g => (g.classId?._id || g.classId) === newClassId);
                setSelectedGroupId(newGroups[0]?._id ?? "");
              }}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground"
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
          ))}
            </select>

            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground"
              disabled={availableGroups.length === 0}
            >
              {availableGroups.length === 0 ? (
                <option value="">No groups available - Create sections first!</option>
              ) : (
                availableGroups.map((g) => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))
              )}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableGroups.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold text-muted-foreground mb-2">No Groups Found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    You need to create a complete hierarchy first:<br />
                    Class → <strong>Group</strong> → Subject → Chapter → Topic
                  </p>
                  <Button onClick={() => navigate('/admin/sections')}>
                    Go to Sections Page
                  </Button>
                </CardContent>
              </Card>
            ) : availableSubjects.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No subjects found for this group.</p>
                  <p className="text-sm text-muted-foreground mt-2">Create sections first from the Sections page!</p>
                  <Button onClick={() => navigate('/admin/sections')} className="mt-4">
                    Go to Sections Page
                  </Button>
                </CardContent>
              </Card>
            ) : (
              availableSubjects.map((subject) => {
                const subjectChapters = getChaptersForSubject(subject._id);
                const isExpanded = expandedSubject === subject._id;
                return (
                  <motion.div key={subject._id} layout className={`self-start bg-card rounded-xl border-2 transition-all duration-300 shadow-sm hover:shadow-md ${
isExpanded ? "border-success/50 shadow-md" : "border-border hover:border-success/30"}`}>
                    <button onClick={() => toggleSubject(subject._id)} className="w-full flex items-center gap-4 p-4 text-left">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-base truncate">{subject.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{subjectChapters.length} chapters</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                          <div className="px-4 pb-4">
                            <div className="border-t border-border pt-3 space-y-0.5">
                              {subjectChapters.length === 0 ? (
                                <p className="text-sm text-muted-foreground p-3">No chapters found</p>
                              ) : (
                                subjectChapters.map((chapter) => (
                                  <div key={chapter._id} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-success/5 transition-colors group">
                                    <button onClick={() => handleChapterClick(subject._id, chapter._id)} className="flex-1 text-sm text-foreground text-left">{chapter.name}</button>
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminQuestions;
