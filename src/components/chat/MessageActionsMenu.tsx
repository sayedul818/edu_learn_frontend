import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Reply, Forward, Pencil, Trash2 } from "lucide-react";

type MessageActionsMenuProps = {
  isMine: boolean;
  onReply: () => void;
  onForward: () => void;
  onEdit: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
};

const MessageActionsMenu = ({
  isMine,
  onReply,
  onForward,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
}: MessageActionsMenuProps) => {
  return (
    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full bg-white/95 text-black shadow-sm hover:bg-white"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isMine ? "end" : "start"} className="min-w-40">
          <DropdownMenuItem className="text-xs" onClick={onReply}>
            <Reply className="mr-2 h-3.5 w-3.5" />
            Reply
          </DropdownMenuItem>
          <DropdownMenuItem className="text-xs" onClick={onForward}>
            <Forward className="mr-2 h-3.5 w-3.5" />
            Forward
          </DropdownMenuItem>
          {isMine ? (
            <DropdownMenuItem className="text-xs" onClick={onEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs" onClick={onDeleteForMe}>
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete for me
          </DropdownMenuItem>
          {isMine ? (
            <DropdownMenuItem className="text-xs text-red-600 focus:text-red-600" onClick={onDeleteForEveryone}>
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete for everyone
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MessageActionsMenu;
