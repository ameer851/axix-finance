import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Document,
  downloadDocument,
  getStatements,
  getTaxDocuments,
} from "@/services/reportService";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Download, FileText, Search } from "lucide-react";
import React, { useState } from "react";

interface ReportsStatementsProps {
  onViewAll?: () => void;
  onDownload?: (document: Document) => void;
  limit?: number;
}

const ReportsStatements: React.FC<ReportsStatementsProps> = ({
  onViewAll,
  onDownload,
  limit = 5,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Fetch statements data
  const { data: statements = [], isLoading: statementsLoading } = useQuery({
    queryKey: ["statements", user?.id, yearFilter, typeFilter],
    queryFn: async () => {
      try {
        if (!user?.id) throw new Error("User ID is required");

        return await getStatements({
          userId: user.id,
          year: yearFilter !== "all" ? yearFilter : undefined,
          type: typeFilter !== "all" ? (typeFilter as any) : undefined,
          limit: limit,
        });
      } catch (error) {
        console.error("Error fetching statements:", error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  // Fetch tax documents
  const { data: taxDocuments = [], isLoading: taxDocumentsLoading } = useQuery({
    queryKey: ["taxDocuments", user?.id, yearFilter],
    queryFn: async () => {
      try {
        if (!user?.id) throw new Error("User ID is required");

        return await getTaxDocuments({
          userId: user.id,
          year: yearFilter !== "all" ? yearFilter : undefined,
          limit: limit,
        });
      } catch (error) {
        console.error("Error fetching tax documents:", error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get document years for filter
  const getDocumentYears = () => {
    const years = new Set<string>();

    [...statements, ...taxDocuments].forEach((doc) => {
      const date = new Date(doc.date);
      years.add(date.getFullYear().toString());
    });

    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  };

  // Filter statements based on search query and filters
  const filteredStatements = statements.filter((statement) => {
    // Search filter
    const matchesSearch =
      statement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      statement.period.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const matchesType = typeFilter === "all" || statement.type === typeFilter;

    // Year filter (already filtered in API call, this is just extra precaution)
    const matchesYear =
      yearFilter === "all" ||
      new Date(statement.date).getFullYear().toString() === yearFilter;

    return matchesSearch && matchesType && matchesYear;
  });

  // Filter tax documents based on search query and filters
  const filteredTaxDocuments = taxDocuments.filter((doc) => {
    // Search filter
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.period.toLowerCase().includes(searchQuery.toLowerCase());

    // Year filter (already filtered in API call, this is just extra precaution)
    const matchesYear =
      yearFilter === "all" ||
      new Date(doc.date).getFullYear().toString() === yearFilter;

    return matchesSearch && matchesYear;
  });

  // Handle document download
  const handleDownload = async (document: Document) => {
    try {
      if (onDownload) {
        onDownload(document);
        return;
      }

      // Download the document
      const blob = await downloadDocument(document.id);

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      // Use window.document to avoid TS lib/DOM mixing issues and assert HTMLElement for append
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.name;
      window.document.body?.appendChild(a as HTMLAnchorElement);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      window.document.body?.removeChild(a);

      toast({
        title: "Download Started",
        description: `${document.name} is downloading.`,
      });
    } catch (error: any) {
      console.error("Error downloading document:", error);

      toast({
        title: "Download Failed",
        description:
          error.message || "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (statementsLoading || taxDocumentsLoading) {
    return (
      <Card>
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Reports & Statements</CardTitle>
          <CardDescription>Access your account documents</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="statements">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="statements">
              <FileText className="h-4 w-4 mr-2" />
              Statements
            </TabsTrigger>
            <TabsTrigger value="tax">
              <Calendar className="h-4 w-4 mr-2" />
              Tax Documents
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {getDocumentYears().map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <TabsContent value="statements" className="m-0 p-0">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </TabsContent>
            </div>
          </div>

          <TabsContent value="statements">
            {filteredStatements.length > 0 ? (
              <Table className="border rounded-md">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStatements.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-primary" />
                          {statement.name}
                        </div>
                      </TableCell>
                      <TableCell>{statement.period}</TableCell>
                      <TableCell>{formatDate(statement.date)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(statement)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No statements found</p>
                {(searchQuery ||
                  yearFilter !== "all" ||
                  typeFilter !== "all") && (
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      setSearchQuery("");
                      setYearFilter("all");
                      setTypeFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tax">
            {filteredTaxDocuments.length > 0 ? (
              <Table className="border rounded-md">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Tax Year</TableHead>
                    <TableHead>Date Issued</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTaxDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                          {doc.name}
                        </div>
                      </TableCell>
                      <TableCell>{doc.period}</TableCell>
                      <TableCell>{formatDate(doc.date)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tax documents found</p>
                {(searchQuery || yearFilter !== "all") && (
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => {
                      setSearchQuery("");
                      setYearFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {onViewAll && (statements.length > 0 || taxDocuments.length > 0) && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={onViewAll}>
              View All Documents
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportsStatements;
