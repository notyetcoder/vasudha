'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Loader2, Lightbulb } from 'lucide-react';
import type { User } from '@/lib/data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import type { SuggestFamilyConnectionsOutput } from '@/ai/flows/suggest-family-connections';

type AISuggestionModalProps = {
    isOpen: boolean;
    onClose: () => void;
    targetUser: User;
    suggestions: SuggestFamilyConnectionsOutput['suggestions'];
    isLoading: boolean;
    onAcceptSuggestion: (targetUser: User, suggestion: SuggestFamilyConnectionsOutput['suggestions'][0], relationship: 'father' | 'mother' | 'spouse') => void;
};

export default function AISuggestionModal({ 
    isOpen, 
    onClose, 
    targetUser, 
    suggestions, 
    isLoading, 
    onAcceptSuggestion 
}: AISuggestionModalProps) {

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>AI Suggestions for {targetUser.name} {targetUser.surname}</DialogTitle>
                    <DialogDescription>
                        The AI has analyzed the community to find potential relatives. Review the suggestions below.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center gap-4 h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Analyzing connections...</p>
                        </div>
                    ) : suggestions.length > 0 ? (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                            {suggestions.map((suggestion, index) => (
                                <Card key={index} className="bg-secondary/50">
                                    <CardHeader>
                                        <CardTitle className="text-base">Suggest: Link <span className="text-primary">{suggestion.name}</span> as {suggestion.relationship}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-start gap-3">
                                            <Lightbulb className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
                                            <p className="text-sm text-muted-foreground italic">"{suggestion.reasoning}"</p>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="ml-auto" size="sm" onClick={() => onAcceptSuggestion(targetUser, suggestion, suggestion.relationship)}>Accept Suggestion</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground p-8">
                            <p>The AI could not find any strong connections for this person.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
