import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { classesAPI, groupsAPI, subjectsAPI, chaptersAPI, topicsAPI } from "@/services/api";

const AdminCreateSection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id: classId } = useParams<{ id: string }>();
  const isEditing = !!classId;

  const [className, setClassName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState<{ name: string; topics: string[] }[]>([]);

  useEffect(() => {
    if (isEditing && classId) {
      loadClassData();
    }
  }, [classId, isEditing]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      const response = await classesAPI.get(classId!);
      setClassName(response.data.name);
    } catch (err) {
      toast({
        title: "Failed to load class",
        description: err instanceof Error ? err.message : "Unknown error"
      });
      console.error('Error loading class:', err);
    } finally {
      setLoading(false);
    }
  };

  const addChapter = () => {
    if (!chapterName) return toast({ title: "Enter chapter name" });
    const existing = chapters.find((c) => c.name === chapterName);
    if (existing) return toast({ title: "Chapter exists" });
    setChapters([...chapters, { name: chapterName, topics: topicName ? [topicName] : [] }]);
    setChapterName("");
    setTopicName("");
  };

  const save = async () => {
    if (!className) return toast({ title: "Enter class name" });
    
    try {
      setLoading(true);

      if (isEditing && classId) {
        // Update existing class
        await classesAPI.update(classId, { name: className });
        toast({ title: "Section updated successfully!" });
      } else {
        // Step 1: Create Class
        console.log('Creating class with name:', className);
        const classResponse = await classesAPI.create({ name: className });
        const classIdNew = classResponse.data._id;
        console.log('✅ Created class:', classResponse.data);

        // Step 2: Create Group (if provided)
        let groupId = null;
        if (groupName.trim()) {
          console.log('Creating group with name:', groupName, 'classId:', classIdNew);
          try {
            const groupResponse = await groupsAPI.create({ 
              name: groupName, 
              classId: classIdNew 
            });
            groupId = groupResponse.data._id;
            console.log('✅ Created group:', groupResponse.data);
          } catch (err) {
            console.error('❌ Failed to create group:', err);
            throw new Error(`Failed to create group: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        } else {
          console.log('⚠️ Skipping group creation - no group name provided');
        }

        // Step 3: Create Subject (if provided and group exists)
        let subjectId = null;
        if (subjectName.trim() && groupId) {
          console.log('Creating subject with name:', subjectName, 'groupId:', groupId);
          try {
            const subjectResponse = await subjectsAPI.create({ 
              name: subjectName, 
              groupId 
            });
            subjectId = subjectResponse.data._id;
            console.log('✅ Created subject:', subjectResponse.data);
          } catch (err) {
            console.error('❌ Failed to create subject:', err);
            throw new Error(`Failed to create subject: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        } else {
          if (subjectName.trim() && !groupId) {
            console.log('⚠️ Skipping subject creation - no group created (group name was empty)');
          } else {
            console.log('⚠️ Skipping subject creation - no subject name provided');
          }
        }

        // Step 4: Create Chapters with Topics
        if (subjectId) {
          // First save chapters that were added to the list
          for (const ch of chapters) {
            console.log('Creating chapter with name:', ch.name, 'subjectId:', subjectId);
            try {
              const chResponse = await chaptersAPI.create({ 
                name: ch.name, 
                subjectId 
              });
              const chapterId = chResponse.data._id;
              console.log('✅ Created chapter:', chResponse.data);

              // Create Topics for this chapter
              for (const topic of ch.topics) {
                console.log('Creating topic with name:', topic, 'chapterId:', chapterId);
                try {
                  const topicResponse = await topicsAPI.create({ 
                    name: topic, 
                    chapterId 
                  });
                  console.log('✅ Created topic:', topicResponse.data);
                } catch (err) {
                  console.error('❌ Failed to create topic:', err);
                  throw new Error(`Failed to create topic: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
              }
            } catch (err) {
              console.error('❌ Failed to create chapter:', err);
              throw new Error(`Failed to create chapter: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }

          // If user typed a chapter name but didn't click "Add Chapter", save it anyway
          if (chapterName.trim() && !chapters.find(c => c.name === chapterName)) {
            console.log('Creating chapter from input field with name:', chapterName, 'subjectId:', subjectId);
            try {
              const chResponse = await chaptersAPI.create({ 
                name: chapterName, 
                subjectId 
              });
              const chapterId = chResponse.data._id;
              console.log('✅ Created chapter from input:', chResponse.data);

              // If there's also a topic typed in, save it
              if (topicName.trim()) {
                console.log('Creating topic from input field with name:', topicName, 'chapterId:', chapterId);
                try {
                  const topicResponse = await topicsAPI.create({ 
                    name: topicName, 
                    chapterId 
                  });
                  console.log('✅ Created topic from input:', topicResponse.data);
                } catch (err) {
                  console.error('❌ Failed to create topic from input:', err);
                  throw new Error(`Failed to create topic: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
              }
            } catch (err) {
              console.error('❌ Failed to create chapter from input:', err);
              throw new Error(`Failed to create chapter: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }
        } else {
          if (chapters.length > 0 || chapterName.trim()) {
            console.log('⚠️ Skipping chapter creation - no subject created (either subject name or group name was empty)');
          }
        }

        console.log('✅ Section creation completed successfully!');
        toast({ 
          title: "Section created successfully!",
          description: `Created: ${className}${groupId ? ' → ' + groupName : ''}${subjectId ? ' → ' + subjectName : ''}`
        });
      }
      
      navigate("/admin/sections");
    } catch (err) {
      console.error('❌ Overall error:', err);
      toast({ 
        title: isEditing ? "Failed to update section" : "Failed to create section",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">{isEditing ? "Edit Section" : "Create Section"}</h1>
        <p className="text-muted-foreground mt-1">
          {isEditing 
            ? "Update class name (saved to MongoDB)" 
            : "Create class → group → subject → chapter → topic (saved to MongoDB)"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Section" : "New Section"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input 
              placeholder="Class (e.g., HSC)" 
              value={className} 
              onChange={(e) => setClassName(e.target.value)}
              disabled={isEditing}
            />
            <Input 
              placeholder="Group (e.g., Science)" 
              value={groupName} 
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isEditing}
            />
            <Input 
              placeholder="Subject (e.g., Chemistry)" 
              value={subjectName} 
              onChange={(e) => setSubjectName(e.target.value)}
              disabled={isEditing}
            />
            <div />
          </div>

          {!isEditing && (
            <div className="mt-4">
              <h3 className="text-sm font-medium">Chapters & Topics</h3>
              <div className="flex gap-2 mt-2">
                <Input placeholder="Chapter name" value={chapterName} onChange={(e) => setChapterName(e.target.value)} />
                <Input placeholder="(Optional) initial topic" value={topicName} onChange={(e) => setTopicName(e.target.value)} />
                <Button onClick={addChapter}>Add Chapter</Button>
              </div>

              <div className="mt-3 space-y-2">
                {chapters.map((c, idx) => (
                  <div key={c.name} className="p-2 rounded-md border border-border flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-muted-foreground">{c.topics.length} topic{c.topics.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <Button onClick={save} disabled={loading}>
              {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Section" : "Save Section")}
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)} disabled={loading}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCreateSection;
