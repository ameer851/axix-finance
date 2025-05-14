import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar, 
  Search, 
  Filter,
  CheckCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

// Mock statements data
const mockStatements = [
  {
    id: '1',
    userId: 'user123',
    type: 'monthly',
    name: 'Account Statement',
    period: 'May 2025',
    date: '2025-05-01T00:00:00Z',
    fileUrl: '/statements/may-2025.pdf',
    fileSize: '245 KB'
  },
  {
    id: '2',
    userId: 'user123',
    type: 'monthly',
    name: 'Account Statement',
    period: 'April 2025',
    date: '2025-04-01T00:00:00Z',
    fileUrl: '/statements/april-2025.pdf',
    fileSize: '238 KB'
  },
  {
    id: '3',
    userId: 'user123',
    type: 'monthly',
    name: 'Account Statement',
    period: 'March 2025',
    date: '2025-03-01T00:00:00Z',
    fileUrl: '/statements/march-2025.pdf',
    fileSize: '252 KB'
  },
  {
    id: '4',
    userId: 'user123',
    type: 'quarterly',
    name: 'Quarterly Performance Report',
    period: 'Q1 2025',
    date: '2025-04-15T00:00:00Z',
    fileUrl: '/reports/q1-2025.pdf',
    fileSize: '410 KB'
  },
  {
    id: '5',
    userId: 'user123',
    type: 'quarterly',
    name: 'Quarterly Performance Report',
    period: 'Q4 2024',
    date: '2025-01-15T00:00:00Z',
    fileUrl: '/reports/q4-2024.pdf',
    fileSize: '395 KB'
  }
];

// Mock tax documents
const mockTaxDocuments = [
  {
    id: '1',
    userId: 'user123',
    type: 'tax',
    name: '1099-DIV',
    period: '2024',
    date: '2025-01-31T00:00:00Z',
    fileUrl: '/tax/1099-div-2024.pdf',
    fileSize: '125 KB'
  },
  {
    id: '2',
    userId: 'user123',
    type: 'tax',
    name: '1099-B',
    period: '2024',
    date: '2025-01-31T00:00:00Z',
    fileUrl: '/tax/1099-b-2024.pdf',
    fileSize: '210 KB'
  },
  {
    id: '3',
    userId: 'user123',
    type: 'tax',
    name: 'Year-End Tax Summary',
    period: '2024',
    date: '2025-01-31T00:00:00Z',
    fileUrl: '/tax/tax-summary-2024.pdf',
    fileSize: '350 KB'
  }
];

interface ReportsStatementsProps {}

const ReportsStatements: React.FC<ReportsStatementsProps> = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Fetch statements data
  const { data: statements = [], isLoading: statementsLoading } = useQuery({
    queryKey: ['statements', user?.id],
    queryFn: async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        return mockStatements;
      } catch (error) {
        console.error('Error fetching statements:', error);
        throw error;
      }
    },
    enabled: !!user?.id
  });
  
  // Fetch tax documents
  const { data: taxDocuments = [], isLoading: taxDocumentsLoading } = useQuery({
    queryKey: ['taxDocuments', user?.id],
    queryFn: async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        return mockTaxDocuments;
      } catch (error) {
        console.error('Error fetching tax documents:', error);
        throw error;
      }
    },
    enabled: !!user?.id
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get document years for filter
  const getDocumentYears = () => {
    const years = new Set<string>();
    
    [...statements, ...taxDocuments].forEach(doc => {
      const date = new Date(doc.date);
      years.add(date.getFullYear().toString());
    });
    
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  };
  
  // Filter statements based on search query and filters
  const filteredStatements = statements.filter(statement => {
    // Search filter
    const matchesSearch = 
      statement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      statement.period.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Year filter
    const statementYear = new Date(statement.date).getFullYear().toString();
    const matchesYear = yearFilter === 'all' || statementYear === yearFilter;
    
    // Type filter
    const matchesType = typeFilter === 'all' || statement.type === typeFilter;
    
    return matchesSearch && matchesYear && matchesType;
  });
  
  // Filter tax documents based on search query and filters
  const filteredTaxDocuments = taxDocuments.filter(doc => {
    // Search filter
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.period.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Year filter
    const docYear = new Date(doc.date).getFullYear().toString();
    const matchesYear = yearFilter === 'all' || docYear === yearFilter;
    
    return matchesSearch && matchesYear;
  });
  
  // Handle document download
  const handleDownload = (fileUrl: string, fileName: string) => {
    // In a real app, this would initiate a download
    // For now, we'll just show a toast
    toast({
      title: 'Download Started',
      description: `Downloading ${fileName}...`,
    });
    
    // Simulate download completion after 2 seconds
    setTimeout(() => {
      toast({
        title: 'Download Complete',
        description: `${fileName} has been downloaded successfully.`,
        variant: 'success'
      });
    }, 2000);
  };
  
  if (statementsLoading || taxDocumentsLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Reports & Statements</CardTitle>
          <CardDescription>Loading your documents...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reports & Statements</CardTitle>
        <CardDescription>Access your account statements, performance reports, and tax documents</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="statements">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="statements">Statements & Reports</TabsTrigger>
            <TabsTrigger value="tax">Tax Documents</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[110px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {getDocumentYears().map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Statements Tab */}
          <TabsContent value="statements">
            {filteredStatements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No statements or reports found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || yearFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Your statements will appear here once they are generated'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStatements.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{statement.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {statement.type.charAt(0).toUpperCase() + statement.type.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{statement.period}</TableCell>
                      <TableCell>{formatDate(statement.date)}</TableCell>
                      <TableCell>{statement.fileSize}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(statement.fileUrl, `${statement.name} - ${statement.period}.pdf`)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          
          {/* Tax Documents Tab */}
          <TabsContent value="tax">
            {filteredTaxDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No tax documents found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || yearFilter !== 'all'
                    ? 'Try adjusting your search or filters' 
                    : 'Your tax documents will appear here once they are generated'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Tax Year</TableHead>
                    <TableHead>Date Issued</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTaxDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{doc.name}</span>
                          <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                            Tax
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{doc.period}</TableCell>
                      <TableCell>{formatDate(doc.date)}</TableCell>
                      <TableCell>{doc.fileSize}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(doc.fileUrl, `${doc.name} - ${doc.period}.pdf`)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReportsStatements;
