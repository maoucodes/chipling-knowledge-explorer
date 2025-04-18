
import { FC, useState } from 'react';
import { format as formatDate } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Trash2Icon } from 'lucide-react';
import { useHistory } from '@/contexts/HistoryContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHistory: (query: string, modules: any[]) => void;
}

const HistoryModal: FC<HistoryModalProps> = ({ isOpen, onClose, onSelectHistory }) => {
  const { history, loading, deleteEntry } = useHistory();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const handleContinue = (entry: any) => {
    if (!entry.modules || !Array.isArray(entry.modules)) {
      toast.error("Cannot continue this journey due to missing data");
      console.error("Missing modules data in history entry:", entry);
      return;
    }
    
    // Ensure each module has at least an empty topics array if it's missing
    const validModules = entry.modules.map(module => ({
      ...module,
      topics: Array.isArray(module.topics) ? module.topics : []
    }));
    
    console.log("Continuing journey with modules:", validModules);
    onSelectHistory(entry.query, validModules);
    onClose();
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
      toast.success("Journey deleted successfully");
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting journey:", error);
      toast.error("Failed to delete journey");
    }
  };

  // Calculate average module progress for history entries
  const calculateModuleProgress = (entry: any) => {
    if (!entry.moduleProgress || Object.keys(entry.moduleProgress).length === 0) {
      return entry.progress || 0;
    }
    
    // Calculate average of module progress values
    const values = Object.values(entry.moduleProgress) as number[];
    if (values.length === 0) return 0;
    
    const sum = values.reduce((acc: number, val: number) => acc + val, 0);
    return Math.round(sum / values.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Your Journeys</DialogTitle>
        </DialogHeader>
        
        {loading && (
          <div className="py-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your journeys...</p>
          </div>
        )}
        
        {!loading && history.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">You haven't started any journeys yet.</p>
          </div>
        )}
        
        {!loading && history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {history.map((entry) => {
              const moduleProgress = calculateModuleProgress(entry);
              
              return (
                <div key={entry.id} className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-md overflow-hidden">
                  <div className="p-5">
                    <h3 className="text-lg font-medium mb-1">{entry.query}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Created on: {entry.createdAt ? formatDate(new Date(entry.createdAt), 'MMM d, yyyy') : 'Unknown date'}
                    </p>
                    <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                      <span>Module Progress</span>
                      <span>{moduleProgress}%</span>
                    </div>
                    <Progress value={moduleProgress} className="h-1.5 mb-4" />
                    
                    {entry.moduleProgress && Object.keys(entry.moduleProgress).length > 0 && (
                      <div className="mt-2 mb-4 space-y-2 border-t border-border/20 pt-2">
                        {Object.entries(entry.moduleProgress).map(([moduleIdx, progress]) => (
                          <div key={moduleIdx} className="text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Module {parseInt(moduleIdx) + 1}</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress as number} className="h-1 mt-1" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-between mt-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingId(entry.id)}>
                            <Trash2Icon className="h-5 w-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your journey and remove the data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(entry.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <Button variant="default" className="ml-auto" onClick={() => handleContinue(entry)}>
                        Continue
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HistoryModal;
