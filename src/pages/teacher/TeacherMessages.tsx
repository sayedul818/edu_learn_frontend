import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const TeacherMessages = () => {
  const [recipient, setRecipient] = useState("All students in selected course");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-primary/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Messages</h1>
        <p className="mt-2 text-base text-slate-300 md:text-lg">Share updates with your students without leaving the teacher panel.</p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Compose Message</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient or audience" />
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message" rows={6} />
            <Button className="w-full">Send (UI Ready)</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Message Center</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>This section is prepared for course announcements and one-to-one teacher-student messaging.</p>
            <p>Next backend step: add message thread endpoints and read receipts.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherMessages;
