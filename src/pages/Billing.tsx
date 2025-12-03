import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, type UserRole } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Receipt, Download, CheckCircle, Clock, TrendingUp, Users } from "lucide-react";

const Billing = () => {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userRole = await getUserRole(user.id);
        setRole(userRole);
      }
    };
    fetchRole();
  }, []);

  // Demo data for bills
  const demoBills = [
    { id: 1, month: "November 2025", amount: "₦2,500.00", dueDate: "Dec 15, 2025", status: "Pending" },
    { id: 2, month: "October 2025", amount: "₦2,500.00", dueDate: "Nov 15, 2025", status: "Paid" },
    { id: 3, month: "September 2025", amount: "₦2,500.00", dueDate: "Oct 15, 2025", status: "Paid" },
    { id: 4, month: "August 2025", amount: "₦2,500.00", dueDate: "Sep 15, 2025", status: "Paid" },
    { id: 5, month: "July 2025", amount: "₦2,500.00", dueDate: "Aug 15, 2025", status: "Paid" },
  ];

  // Demo data for collector confirmations
  const demoConfirmations = [
    { id: 1, user: "John Doe", amount: "₦2,500.00", date: "Dec 3, 2025", status: "Pending" },
    { id: 2, user: "ABC Company Ltd", amount: "₦5,000.00", date: "Dec 2, 2025", status: "Confirmed" },
    { id: 3, user: "Mary Johnson", amount: "₦2,500.00", date: "Dec 1, 2025", status: "Confirmed" },
    { id: 4, user: "XYZ Enterprise", amount: "₦7,500.00", date: "Nov 30, 2025", status: "Pending" },
    { id: 5, user: "Grace Obi", amount: "₦2,500.00", date: "Nov 29, 2025", status: "Confirmed" },
  ];

  // Demo data for admin transactions
  const demoTransactions = [
    { id: 1, user: "John Doe", type: "Payment", amount: "₦2,500.00", date: "Dec 3, 2025", status: "Completed" },
    { id: 2, user: "XYZ Corporation", type: "Payment", amount: "₦5,000.00", date: "Dec 2, 2025", status: "Pending" },
    { id: 3, user: "Mary Johnson", type: "Refund", amount: "₦1,000.00", date: "Dec 1, 2025", status: "Processed" },
    { id: 4, user: "Tech Solutions Ltd", type: "Payment", amount: "₦7,500.00", date: "Nov 30, 2025", status: "Completed" },
    { id: 5, user: "Grace Obi", type: "Payment", amount: "₦2,500.00", date: "Nov 29, 2025", status: "Completed" },
    { id: 6, user: "ABC Company", type: "Payment", amount: "₦5,000.00", date: "Nov 28, 2025", status: "Failed" },
  ];

  const renderCitizenCompanyView = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Billing & Payments</h2>
        <p className="text-muted-foreground mt-1">Manage your waste service bills and payments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₦2,500.00</div>
            <p className="text-xs text-muted-foreground">Due Dec 15, 2025</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid (2025)</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦25,000.00</div>
            <p className="text-xs text-muted-foreground">10 payments made</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Due Date</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Dec 15</div>
            <p className="text-xs text-muted-foreground">12 days remaining</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Make Payment
                </CardTitle>
                <CardDescription>Pay your current balance</CardDescription>
              </div>
              <Badge variant="secondary">Demo</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-3xl font-bold text-primary">₦2,500.00</p>
              <p className="text-xs text-muted-foreground mt-1">November 2025 - Waste Collection Service</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Select Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="h-auto py-3 flex flex-col">
                  <span className="text-xs">Bank Transfer</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex flex-col">
                  <span className="text-xs">Card Payment</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex flex-col">
                  <span className="text-xs">USSD</span>
                </Button>
              </div>
            </div>

            <Button className="w-full" size="lg">
              <CreditCard className="h-4 w-4 mr-2" />
              Pay ₦2,500.00
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Billing History
                </CardTitle>
                <CardDescription>View and download past invoices</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{bill.month}</p>
                    <p className="text-xs text-muted-foreground">Due: {bill.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium">{bill.amount}</p>
                      <Badge 
                        variant={bill.status === "Paid" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {bill.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCollectorView = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Payment Confirmations</h2>
        <p className="text-muted-foreground mt-1">Confirm received payments from users</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Confirmations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">2</div>
            <p className="text-xs text-muted-foreground">Awaiting your confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">5</div>
            <p className="text-xs text-muted-foreground">Payments verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦45,000</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Payment Requests
              </CardTitle>
              <CardDescription>Review and confirm user payments</CardDescription>
            </div>
            <Badge variant="secondary">Demo</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {demoConfirmations.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{payment.user}</p>
                  <p className="text-xs text-muted-foreground">{payment.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium">{payment.amount}</p>
                  {payment.status === "Pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="default">Confirm</Button>
                      <Button size="sm" variant="outline">Reject</Button>
                    </div>
                  ) : (
                    <Badge variant="default">Confirmed</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAdminView = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Billing Activity</h2>
        <p className="text-muted-foreground mt-1">Monitor all payment activities across the platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₦1,250,000</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦125,000</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">₦45,000</div>
            <p className="text-xs text-muted-foreground">18 invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">248</div>
            <p className="text-xs text-muted-foreground">+8 this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>Latest payment activities</CardDescription>
              </div>
              <Badge variant="secondary">Demo</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{tx.user}</p>
                    <p className="text-xs text-muted-foreground">{tx.type} • {tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{tx.amount}</p>
                    <Badge 
                      variant={
                        tx.status === "Completed" ? "default" : 
                        tx.status === "Pending" ? "secondary" : 
                        tx.status === "Failed" ? "destructive" : "outline"
                      }
                      className="text-xs"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue Summary
            </CardTitle>
            <CardDescription>Monthly breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { month: "December 2025", amount: "₦125,000", growth: "+12%" },
                { month: "November 2025", amount: "₦112,000", growth: "+8%" },
                { month: "October 2025", amount: "₦104,000", growth: "+5%" },
                { month: "September 2025", amount: "₦99,000", growth: "+3%" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{item.month}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium">{item.amount}</p>
                    <Badge variant="outline" className="text-xs text-green-600">
                      {item.growth}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {(role === "citizen" || role === "company") && renderCitizenCompanyView()}
      {role === "collector" && renderCollectorView()}
      {role === "admin" && renderAdminView()}
    </DashboardLayout>
  );
};

export default Billing;
