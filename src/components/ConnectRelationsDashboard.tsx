
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import type { User } from '@/lib/data';
import type { AdminUser } from '@/lib/admin-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  UserPlus,
  Download,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp,
  Link2,
  Link2Off,
  Sparkles,
} from 'lucide-react';
import RelativeSelectionModal from './RelativeSelectionModal';
import UserFormModal from './UserFormModal';
import { useToast } from '@/hooks/use-toast';
import { adminCreateUser, approveUserAction, updateUserAction } from '@/actions/users';
import Papa from 'papaparse';
import FamilyConnectionDetails from './FamilyConnectionDetails';
import { Label } from './ui/label';
import { suggestFamilyConnections, type SuggestFamilyConnectionsOutput } from '@/ai/flows/suggest-family-connections';
import AISuggestionModal from './AISuggestionModal';

type RelationType = 'fatherId' | 'motherId' | 'spouseId';

export default function ConnectRelationsDashboard({ allUsers, adminUser }: { allUsers: User[], adminUser: AdminUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [unlinkedOnly, setUnlinkedOnly] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRelation, setEditingRelation] = useState<RelationType | null>(null);
  const [userToPrefill, setUserToPrefill] = useState<Partial<User> | undefined>(undefined);

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const [suggestionUser, setSuggestionUser] = useState<User | null>(null);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestFamilyConnectionsOutput['suggestions']>([]);
  
  const { toast } = useToast();

  const sortedSurnames = useMemo(() => {
    const maidenNames = allUsers.map(u => u.maidenName).filter(Boolean);
    const currentSurnames = allUsers.map(u => u.surname).filter(Boolean);
    // Sort by length descending to match longer surnames first (e.g., "VARCHAND" before "RAM")
    return [...new Set([...maidenNames, ...currentSurnames])].sort((a, b) => b.length - a.length);
  }, [allUsers]);

  const parseFirstName = (fullName?: string) => {
      if (!fullName) return '';
      let potentialFirstName = fullName;
      for (const surname of sortedSurnames) {
          if (potentialFirstName.endsWith(surname)) {
              return potentialFirstName.substring(0, potentialFirstName.length - surname.length).trim();
          }
      }
      return potentialFirstName;
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const searchMatch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || user.status === statusFilter;
      const genderMatch = genderFilter === 'all' || user.gender === genderFilter;
      const unlinkedMatch = !unlinkedOnly || !user.fatherId || !user.motherId || (user.maritalStatus === 'married' && !user.spouseId);
      return searchMatch && statusMatch && genderMatch && unlinkedMatch;
    });
  }, [allUsers, searchTerm, statusFilter, genderFilter, unlinkedOnly]);

  useEffect(() => {
    setSelectedUserIds(new Set());
  }, [searchTerm, statusFilter, genderFilter, unlinkedOnly]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectOne = (userId: string, checked: boolean) => {
    const newSet = new Set(selectedUserIds);
    if (checked) newSet.add(userId);
    else newSet.delete(userId);
    setSelectedUserIds(newSet);
  };
  
  const handleBulkApprove = async () => {
    const usersToApprove = Array.from(selectedUserIds).map(id => allUsers.find(u => u.id === id)).filter(u => u && u.status === 'pending');
    if (usersToApprove.length === 0) {
      toast({ title: "No action taken", description: "No pending users were selected." });
      return;
    }
    const approvePromises = usersToApprove.map(u => approveUserAction(u!.id));
    await Promise.all(approvePromises);
    toast({ title: "Bulk Action Complete", description: `${usersToApprove.length} users have been approved.` });
    setSelectedUserIds(new Set());
  };

  const openRelationModal = (user: User, relation: RelationType) => {
    setEditingUser(user);
    setEditingRelation(relation);
    setIsModalOpen(true);
  };
  
  const handleClearRelation = async (user: User, relation: RelationType) => {
     const updatedUser: User = { ...user, [relation]: undefined };
     if (relation === 'fatherId') updatedUser.fatherName = '';
     if (relation === 'motherId') updatedUser.motherName = '';
     if (relation === 'spouseId') updatedUser.spouseName = '';
     
     const result = await updateUserAction(updatedUser);
     if (result.success) {
        toast({ title: 'Relation Cleared', description: `${relation.replace('Id', '')} for ${user.name} has been unlinked.` });
     } else {
        toast({ variant: 'destructive', title: 'Update Failed' });
     }
  };

  const handleSelectRelative = async (relative: User) => {
    if (editingUser && editingRelation) {
      const updatedUser: User = { 
        ...editingUser, 
        [editingRelation]: relative.id
      };
      
      const relationName = `${relative.name}${relative.surname}`;
      if (editingRelation === 'fatherId') updatedUser.fatherName = relationName;
      if (editingRelation === 'motherId') updatedUser.motherName = relationName;
      if (editingRelation === 'spouseId') updatedUser.spouseName = relationName;

      const result = await updateUserAction(updatedUser);
      if (result.success) {
        toast({ title: 'Relation Updated', description: `${editingRelation.replace('Id', '')} for ${editingUser.name} has been set.` });
      } else {
        toast({ variant: 'destructive', title: 'Update Failed' });
      }
    }
    setIsModalOpen(false);
    setEditingUser(null);
    setEditingRelation(null);
  };

  const handleManualSave = async (name: string) => {
    if (editingUser && editingRelation) {
      const relationNameKey = editingRelation.replace('Id', 'Name') as 'fatherName' | 'motherName' | 'spouseName';
      const updatedUser: User = { 
          ...editingUser, 
          [editingRelation]: undefined, // Clear ID
          [relationNameKey]: name // Set name
      };

      const result = await updateUserAction(updatedUser);
      if (result.success) {
        toast({ title: 'Relation Updated', description: `${relationNameKey.replace('Name', '')} for ${editingUser.name} has been set.` });
      } else {
        toast({ variant: 'destructive', title: 'Update Failed' });
      }
    }
    setIsModalOpen(false);
    setEditingUser(null);
    setEditingRelation(null);
  };

  const getModalUsers = () => {
    if (!editingRelation || !editingUser) return [];
    let potentialRelatives = allUsers.filter(u => u.id !== editingUser.id && u.status === 'approved');
    switch (editingRelation) {
        case 'fatherId': return potentialRelatives.filter(u => u.gender === 'male');
        case 'motherId': return potentialRelatives.filter(u => u.gender === 'female');
        case 'spouseId':
             // Filter out anyone who is already married
             let potentialSpouses = potentialRelatives.filter(u => !u.spouseId);
             if (editingUser.gender === 'male') return potentialSpouses.filter(u => u.gender === 'female');
             if (editingUser.gender === 'female') return potentialSpouses.filter(u => u.gender === 'male');
             return potentialSpouses;
        default: return [];
    }
  };

  const getModalTitle = () => {
    if (!editingRelation || !editingUser) return "Select Relative";
    const relationName = editingRelation.replace('Id', '');
    return `Select ${relationName} for ${editingUser.name} ${editingUser.surname}`;
  }

  const handleAiSuggest = async (userToSuggestFor: User) => {
    setAiSuggestions([]);
    setSuggestionUser(userToSuggestFor);
    setIsSuggestionLoading(true);

    try {
        const communityProfiles = allUsers
            .filter(u => u.status === 'approved' && u.id !== userToSuggestFor.id)
            .map(p => ({
                id: p.id,
                name: `${p.name} ${p.surname}`,
                surname: p.surname,
                gender: p.gender,
                birthYear: p.birthYear || '',
                spouseId: p.spouseId,
            }));

        const userProfile = {
            id: userToSuggestFor.id,
            name: `${userToSuggestFor.name} ${userToSuggestFor.surname}`,
            surname: userToSuggestFor.surname,
            gender: userToSuggestFor.gender,
            maritalStatus: userToSuggestFor.maritalStatus,
            fatherName: userToSuggestFor.fatherName,
            motherName: userToSuggestFor.motherName,
            spouseName: userToSuggestFor.spouseName,
        };
        const result = await suggestFamilyConnections({ userProfile, communityProfiles });
        setAiSuggestions(result.suggestions);
    } catch (error) {
        console.error("AI suggestion failed", error);
        toast({ variant: 'destructive', title: 'AI Suggestion Failed', description: 'Could not get suggestions from the AI.' });
        setSuggestionUser(null); // Close modal on error
    } finally {
        setIsSuggestionLoading(false);
    }
  };

  const handleAcceptSuggestion = async (targetUser: User, suggestedRelative: SuggestFamilyConnectionsOutput['suggestions'][0], relationship: 'father' | 'mother' | 'spouse') => {
      const relationIdField = `${relationship}Id` as 'fatherId' | 'motherId' | 'spouseId';
      const relationNameField = `${relationship}Name` as 'fatherName' | 'motherName' | 'spouseName';

      const updatedUser: User = {
          ...targetUser,
          [relationIdField]: suggestedRelative.userId,
          [relationNameField]: suggestedRelative.name,
      };
      
      const result = await updateUserAction(updatedUser);
      if (result.success) {
          toast({ title: 'Connection Linked!', description: `${suggestedRelative.name} has been linked as ${targetUser.name}'s ${relationship}.` });
          setSuggestionUser(null); // Close modal
      } else {
          toast({ variant: 'destructive', title: 'Update Failed' });
      }
  };

  const renderRelationCell = (user: User, relation: RelationType) => {
      const relationId = user[relation];
      const relationTypeCapitalized = relation.charAt(0).toUpperCase() + relation.slice(1).replace('Id', '');
      const relationNameKey = relation.replace('Id', 'Name') as 'fatherName' | 'motherName' | 'spouseName';
      const relationName = user[relationNameKey];

      if (relationId) {
          return (
              <div className="flex items-center gap-2 group w-full justify-between">
                <div className="flex items-center gap-2 truncate">
                    <Link2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm truncate">{parseFirstName(relationName)}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0" title={`Clear ${relation.replace('Id','')}`} onClick={(e) => { e.stopPropagation(); handleClearRelation(user, relation)}}>
                    <Link2Off className="h-4 w-4 text-red-500" />
                </Button>
              </div>
          )
      }
      
      if (relationName) {
        return (
            <div className="flex items-center justify-between gap-2 w-full group">
                <Button variant="link" size="sm" className="p-0 h-auto text-sm font-normal italic text-muted-foreground truncate" onClick={(e) => { e.stopPropagation(); openRelationModal(user, relation); }}>
                    <span className="truncate">{parseFirstName(relationName)}</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0" title="AI Suggest Connection" onClick={(e) => { e.stopPropagation(); handleAiSuggest(user); }}>
                    <Sparkles className="h-4 w-4 text-purple-500" />
                </Button>
            </div>
        )
      }
      
      return (
          <Button variant="link" size="sm" className="p-0 h-auto text-sm font-normal flex items-center gap-2 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); openRelationModal(user, relation); }}>
            <Link2 className="h-4 w-4" /> Link {relationTypeCapitalized}
          </Button>
      )
  };

  const handleCreateNewUser = (prefillData?: Partial<User>) => {
    setUserToPrefill(prefillData);
    setIsCreateModalOpen(true);
  };

  const handleSaveNewUser = async (formData: any) => {
    const result = await adminCreateUser(formData);
    if (result.success) {
        toast({ title: "Success", description: result.message });
        setIsCreateModalOpen(false);
        setUserToPrefill(undefined);
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
  };
  
  const handleExport = () => {
    if (filteredUsers.length === 0) {
        toast({ variant: "destructive", title: "No Data to Export", description: "There are no users matching the current filters." });
        return;
    }
    const fields = [
      'id', 'name', 'maidenName', 'surname', 'family', 'gender', 'maritalStatus', 'birthMonth', 'birthYear',
      'fatherName', 'motherName', 'spouseName',
      'fatherId', 'motherId', 'spouseId',
      'status', 'description', 'profilePictureUrl'
    ];
    const csvData = Papa.unparse({ fields, data: filteredUsers });
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `vasudha_connect_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleRowExpansion = (userId: string) => {
    setExpandedUserId(currentId => currentId === userId ? null : userId);
  };

  return (
    <div className="h-full flex flex-col">
        <section className="p-6 bg-white border-b flex flex-wrap gap-4 items-center">
             <div className="relative min-w-[250px] flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search name, surname or ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="All Genders" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Genders</SelectItem><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem></SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
                <Checkbox id="unlinked-only" checked={unlinkedOnly} onCheckedChange={(checked) => setUnlinkedOnly(!!checked)} />
                <Label htmlFor="unlinked-only" className="text-sm font-medium whitespace-nowrap text-gray-700">Unlinked Only</Label>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button onClick={() => handleCreateNewUser()}><UserPlus className="mr-2 h-4 w-4" />Create New Person</Button>
              <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
            </div>
        </section>
        
        <main className="flex-1 overflow-auto p-6">
          <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[50px] px-4"><Checkbox onCheckedChange={handleSelectAll} checked={ filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length ? true : selectedUserIds.size > 0 ? 'indeterminate' : false } /></TableHead>
                  <TableHead className="w-[110px]">ID</TableHead>
                  <TableHead className="min-w-[200px]">Profile</TableHead>
                  <TableHead className="min-w-[180px]">Father</TableHead>
                  <TableHead className="min-w-[180px]">Mother</TableHead>
                  <TableHead className="min-w-[180px]">Spouse</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                  <React.Fragment key={user.id}>
                    <TableRow data-state={selectedUserIds.has(user.id) ? 'selected' : ''} className="group hover:bg-gray-50">
                      <TableCell className="px-4" onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedUserIds.has(user.id)} onCheckedChange={(checked) => handleSelectOne(user.id, !!checked)} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">{user.id}</TableCell>
                      <TableCell>
                         <div className="flex items-center gap-3">
                            <Image src={user.profilePictureUrl} alt={user.name} width={36} height={36} className="rounded-full" data-ai-hint="profile avatar" />
                            <div>
                                <p className="font-medium">{user.name} {user.surname}</p>
                                <p className="text-xs text-muted-foreground capitalize">{user.gender}</p>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell>{renderRelationCell(user, 'fatherId')}</TableCell>
                      <TableCell>{renderRelationCell(user, 'motherId')}</TableCell>
                      <TableCell>{user.maritalStatus === 'married' ? renderRelationCell(user, 'spouseId') : <span className='text-sm text-muted-foreground'>Single</span>}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Checkbox id={`approve-${user.id}`} checked={user.status === 'approved'} onCheckedChange={async (checked) => { if (checked && user.status !== 'approved') { const result = await approveUserAction(user.id); if (result.success) toast({ title: "Profile Approved", description: `${user.name} ${user.surname} is now visible.` }); } }} disabled={user.status === 'approved'} />
                          <Label htmlFor={`approve-${user.id}`} className={`text-xs font-medium capitalize ${user.status === 'approved' ? 'text-green-600' : 'text-amber-600'}`}>{user.status}</Label>
                        </div>
                      </TableCell>
                       <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); toggleRowExpansion(user.id); }} title={expandedUserId === user.id ? 'Collapse' : 'Expand'}>
                                {expandedUserId === user.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                <Link href={`/profile/${user.id}`} target="_blank" title="View Profile">
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View Profile</span>
                                </Link>
                              </Button>
                              {user.maritalStatus === 'married' && !user.spouseId && !user.spouseName && (<div title="Inconsistency: Married but no spouse linked."><AlertTriangle className="h-4 w-4 text-amber-500" /></div>)}
                          </div>
                       </TableCell>
                    </TableRow>
                    {expandedUserId === user.id && (
                       <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableCell colSpan={8} className="p-4">
                             <FamilyConnectionDetails selectedUser={user} allUsers={allUsers} onAddNewRelative={handleCreateNewUser} />
                          </TableCell>
                       </TableRow>
                    )}
                  </React.Fragment>
                )) : (<TableRow><TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No users match the current filters.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </main>
      
        {isModalOpen && editingUser && <RelativeSelectionModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            users={getModalUsers()} 
            allUsers={allUsers} 
            onSelect={handleSelectRelative} 
            onManualSave={handleManualSave} 
            title={getModalTitle()} 
            selectionType={editingRelation ? editingRelation.replace('Id', '') as 'father' | 'mother' | 'spouse' : null}
        />}
        
        <UserFormModal mode="create" isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setUserToPrefill(undefined); }} onSave={handleSaveNewUser} prefillData={userToPrefill} />

        {suggestionUser && (
            <AISuggestionModal
                isOpen={!!suggestionUser}
                onClose={() => setSuggestionUser(null)}
                targetUser={suggestionUser}
                suggestions={aiSuggestions}
                isLoading={isSuggestionLoading}
                onAcceptSuggestion={handleAcceptSuggestion}
            />
        )}

        {selectedUserIds.size > 0 && (
            <footer className="sticky bottom-0 z-10 p-3 bg-white/80 backdrop-blur-sm border-t shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                  <p className="text-sm font-medium"><span className="font-bold">{selectedUserIds.size}</span> selected</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedUserIds(new Set())}>Deselect All</Button>
                    <Button onClick={handleBulkApprove} size="sm">Approve Selected</Button>
                  </div>
                </div>
            </footer>
        )}
    </div>
  );
}
