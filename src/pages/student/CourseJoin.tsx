import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { coursesAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

type JoinState = "loading" | "requested" | "already" | "pending" | "error";

const CourseJoin = () => {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<JoinState>("loading");
  const [courseTitle, setCourseTitle] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorText("Invalid invite link.");
      return;
    }

    (async () => {
      try {
        const res = await coursesAPI.joinByInviteToken(token);
        const data = res?.data || {};
        setCourseTitle(data.courseTitle || "this course");
        if (data.alreadyEnrolled) {
          setState("already");
          return;
        }
        if (data.alreadyRequested) {
          setState("pending");
          return;
        }

        setState("requested");
        toast({ title: "Join request sent" });
      } catch (error: any) {
        setState("error");
        setErrorText(error?.message || "Unable to join this course.");
      }
    })();
  }, [token]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Join Course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "loading" && <p className="text-sm text-muted-foreground">Checking invite link...</p>}
          {state === "requested" && <p className="text-sm">Your request to join {courseTitle} has been sent. Wait for teacher approval.</p>}
          {state === "pending" && <p className="text-sm">Your join request for {courseTitle} is still pending teacher approval.</p>}
          {state === "already" && <p className="text-sm">You are already enrolled in {courseTitle}.</p>}
          {state === "error" && <p className="text-sm text-destructive">{errorText}</p>}

          <div className="flex gap-2">
            <Button onClick={() => navigate("/dashboard")}>Go To Dashboard</Button>
            <Button variant="outline" onClick={() => navigate("/exams")}>Go To Exams</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseJoin;
