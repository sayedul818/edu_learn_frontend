import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { classesAPI, groupsAPI, subjectsAPI, chaptersAPI } from "@/services/api";
import { ChevronDown, ChevronRight, BookOpen, FileText, Pencil } from "lucide-react";
import BeautifulLoader from "@/components/ui/beautiful-loader";
import { useToast } from "@/hooks/use-toast";

const QuestionBank = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Database data
  const [classes, setClasses] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load all data from database
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [classesRes, groupsRes, subjectsRes, chaptersRes] = await Promise.all([
        classesAPI.getAll(),
        groupsAPI.getAll(),
        subjectsAPI.getAll(),
        chaptersAPI.getAll()
      ]);

      console.log('📚 Classes loaded:', classesRes.data?.length);
      console.log('📁 Groups loaded:', groupsRes.data?.length);
      console.log('📖 Subjects loaded:', subjectsRes.data?.length);
      console.log('📝 Chapters loaded:', chaptersRes.data?.length);

      setClasses(classesRes.data || []);
      setGroups(groupsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setChapters(chaptersRes.data || []);

      // Auto-select first class if available
      if (classesRes.data?.length > 0) {
        setSelectedClass(classesRes.data[0]._id);
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

  // Compute available groups based on selected class
  const availableGroups = groups.filter(g => (g.classId?._id || g.classId) === selectedClass);

  // Reset group when class changes
  useEffect(() => {
    if (selectedClass && availableGroups.length > 0) {
      if (!selectedGroup || !availableGroups.some(g => g._id === selectedGroup)) {
        setSelectedGroup(availableGroups[0]._id);
      }
    }
  }, [selectedClass, availableGroups]);

  // Get subjects for selected group (subjects are linked via groupId, not classId)
  const filteredSubjects = subjects.filter(s => {
    if (selectedGroup && (s.groupId?._id || s.groupId) !== selectedGroup) return false;
    return true;
  });

  const toggleSubject = (id: string) => {
    setExpandedSubject(expandedSubject === id ? null : id);
  };

  const handleChapterClick = (subjectId: string, chapterId: string) => {
    navigate(`/questions/${subjectId}/${chapterId}`);
  };

  // Get chapters for a subject
  const getChaptersForSubject = (subjectId: string) => {
    return chapters.filter(c => (c.subjectId?._id || c.subjectId) === subjectId);
  };

  return (
    <div className="space-y-6 font-bangla">
      {/* Blue gradient announcement banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 p-6 md:p-8">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 hidden md:block">
          <div className="relative">
            <FileText className="h-20 w-20 text-white" />
            <Pencil className="h-8 w-8 text-white absolute -right-2 -bottom-1" />
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left md:ml-28">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              📚 প্রশ্নব্যাংক
            </h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              বিষয়ভিত্তিক প্রশ্ন অনুশীলন করো এবং পরীক্ষায় ভালো ফলাফল করো
            </p>
          </div>
          <button className="px-6 py-2.5 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-sm whitespace-nowrap shadow-lg">
            প্রশ্নব্যাংক দেখুন
          </button>
        </div>
      </div>

      {/* Filters */}
      {loading ? (
        <BeautifulLoader message="ডাটা লোড করছি..." compact className="py-8" />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-success/40"
            >
              <option value="">ক্লাস নির্বাচন করুন</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              disabled={!selectedClass}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-success/40 disabled:opacity-50"
            >
              <option value="">গ্রুপ নির্বাচন করুন</option>
              {availableGroups.map((g) => (
                <option key={g._id} value={g._id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Subject Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSubjects.map((subject) => {
              const subjectChapters = getChaptersForSubject(subject._id);
              return (
                <motion.div
                  key={subject._id}
                  layout
                  className={`self-start bg-card rounded-xl border-2 transition-all duration-300 shadow-sm hover:shadow-md ${
                    expandedSubject === subject._id
                      ? "border-success/50 shadow-md"
                      : "border-border hover:border-success/30"
                  }`}
                >
                  {/* Subject Header */}
                  <button
                    onClick={() => toggleSubject(subject._id)}
                    className="w-full flex items-center gap-4 p-4 text-left"
                  >
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-2xl flex-shrink-0">
                      📚
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-base truncate">
                          {subject.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {subjectChapters.length}টি অধ্যায়
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedSubject === subject._id ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                  </button>

                  {/* Expanded Chapter List */}
                  <AnimatePresence>
                    {expandedSubject === subject._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <div className="border-t border-border pt-3 space-y-0.5">
                            {subjectChapters.length > 0 ? (
                              subjectChapters.map((chapter) => (
                                <button
                                  key={chapter._id}
                                  onClick={() => handleChapterClick(subject._id, chapter._id)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-success/5 transition-colors group"
                                >
                                  <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-success flex-shrink-0" />
                                  <span className="text-sm text-foreground group-hover:text-success flex-1 truncate">
                                    {chapter.name}
                                  </span>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground px-3 py-2">কোনো অধ্যায় নেই</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {filteredSubjects.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>কোনো বিষয় খুঁজে পাওয়া যায়নি</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuestionBank;
