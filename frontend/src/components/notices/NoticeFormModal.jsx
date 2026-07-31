import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import NoticeForm from "./NoticeForm";

const NoticeFormModal = ({
  open,
  onOpenChange,
  initialValues = {},
  onSubmit,
  loading = false,
  title = "Create Notice",
  description = "Fill in the details below to create a notice.",
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <NoticeForm
          initialValues={initialValues}
          onSubmit={onSubmit}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default NoticeFormModal;
