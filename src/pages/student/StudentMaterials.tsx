import { useEffect, useMemo, useState } from "react";
import { coursesAPI } from "@/services/api";
import { useStudentCourse } from "@/contexts/StudentCourseContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ExternalLink, FileText, Link as LinkIcon, PlayCircle, Search } from "lucide-react";

type MaterialType = "pdf" | "doc" | "video" | "link";

type MaterialItem = {
  _id: string;
  title: string;
  url: string;
  type?: string;
  description?: string;
  uploadedAt?: string;
};

type CourseMaterialsRow = {
  courseId: string;
  courseTitle: string;
  materials: MaterialItem[];
};

const getKind = (material: MaterialItem): MaterialType => {
  const type = String(material.type || "").toLowerCase();
  const url = String(material.url || "").toLowerCase();
  if (type === "pdf" || url.includes(".pdf")) return "pdf";
  if (type === "video" || url.includes("youtube") || url.includes("youtu.be") || url.includes("video")) return "video";
  if (type === "doc" || url.includes(".doc") || url.includes(".docx") || url.includes(".ppt") || url.includes(".pptx")) return "doc";
  return "link";
};

const StudentMaterials = () => {
  const { toast } = useToast();
  const { selectedCourseId, selectedCourse } = useStudentCourse();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CourseMaterialsRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | MaterialType>("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await coursesAPI.listMyMaterials();
        setRows(Array.isArray(res?.data) ? res.data : []);
      } catch (error: any) {
        toast({
          title: "Failed to load materials",
          description: error?.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toast]);

  const flattened = useMemo(() => {
    const scopedRows = selectedCourseId
      ? rows.filter((row) => String(row.courseId) === String(selectedCourseId))
      : rows;
    return scopedRows.flatMap((row) =>
      (row.materials || []).map((material) => ({
        ...material,
        courseId: row.courseId,
        courseTitle: row.courseTitle,
        kind: getKind(material),
      }))
    );
  }, [rows, selectedCourseId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flattened.filter((material) => {
      const matchesSearch =
        !q ||
        String(material.title || "").toLowerCase().includes(q) ||
        String(material.description || "").toLowerCase().includes(q) ||
        String(material.courseTitle || "").toLowerCase().includes(q);
      const matchesType = filter === "all" || material.kind === filter;
      return matchesSearch && matchesType;
    });
  }, [flattened, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card to-muted/60 p-5 shadow-lg md:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 mb-3">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Student Materials Center</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">Course Materials</h1>
          <p className="text-muted-foreground text-sm">{selectedCourse ? `Materials for ${selectedCourse.courseTitle}` : "View all teacher-uploaded materials from your enrolled courses."}</p>
        </div>
      </div>

      <Card
        className="border border-slate-200 shadow-none dark:border-slate-700 dark:bg-slate-900/80 bg-slate-50/80"
      >
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              placeholder="Search by title, course, or description..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "pdf", label: "PDF" },
              { key: "doc", label: "Doc" },
              { key: "video", label: "Video" },
              { key: "link", label: "Link" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key as "all" | MaterialType)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${filter === item.key ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-card text-muted-foreground hover:bg-muted/40"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Loading materials...</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">No materials found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="space-y-4">
            {paginated.map((material) => (
              <Card
                key={`${material.courseId}-${material._id}`}
                className="group border border-slate-200 transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/80 bg-slate-50/80"
                style={{ boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px" }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        {material.kind === "video" ? <PlayCircle className="h-6 w-6" /> : material.kind === "pdf" || material.kind === "doc" ? <FileText className="h-6 w-6" /> : <LinkIcon className="h-6 w-6" />}
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="line-clamp-1 text-lg font-semibold leading-tight text-foreground">{material.title}</p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{material.description || "No description provided."}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start lg:self-center">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {material.uploadedAt ? new Date(material.uploadedAt).toLocaleDateString() : "Recently added"}
                      </span>
                      <Button asChild variant="outline" className="h-10">
                        <a href={material.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" /> View Material
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMaterials;
