import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToExcel, formatDate, formatRating } from './excelUtils';
import { FeedbackStats } from '@/lib/storage';

interface DepartmentExcelReportProps {
  departmentName: string;
  facultyStats: FeedbackStats[];
  departmentStats?: FeedbackStats;
  loading?: boolean;
}

export const DepartmentExcelReport: React.FC<DepartmentExcelReportProps> = ({
  departmentName,
  facultyStats,
  departmentStats,
  loading = false
}) => {
  const generateReport = () => {
    const sheets = [];

    // Department Overview Sheet
    if (departmentStats) {
      sheets.push({
        name: 'Department Overview',
        data: [
          { Metric: 'Department', Value: departmentName },
          { Metric: 'Report Generated', Value: formatDate(new Date()) },
          { Metric: 'Total Faculty', Value: facultyStats.length },
          { Metric: '', Value: '' },
          { Metric: 'Department Average Rating', Value: formatRating(departmentStats.averageRating) },
          { Metric: 'Total Submissions', Value: departmentStats.totalSubmissions },
          { Metric: 'Rating Trend (Last 7 days)', Value: departmentStats.trend.last7Days },
          { Metric: 'Rating Trend (Last 30 days)', Value: departmentStats.trend.last30Days },
          { Metric: 'Rating Trend (Last 90 days)', Value: departmentStats.trend.last90Days },
        ],
        headers: ['Metric', 'Value']
      });

      // Department Category Scores
      sheets.push({
        name: 'Department Categories',
        data: Object.entries(departmentStats.categoryScores).map(([category, score]) => ({
          Category: category,
          Average_Score: formatRating(score.average),
          Response_Count: score.count
        })),
        headers: ['Category', 'Average Score', 'Response Count']
      });
    }

    // Faculty Performance Sheet
    sheets.push({
      name: 'Faculty Performance',
      data: facultyStats
        .map(stats => ({
          Faculty_ID: stats.facultyId || '',
          Average_Rating: formatRating(stats.averageRating),
          Total_Submissions: stats.totalSubmissions,
          Rating_Trend_7D: stats.trend.last7Days,
          Rating_Trend_30D: stats.trend.last30Days,
          Rating_Trend_90D: stats.trend.last90Days,
          Last_Updated: formatDate(stats.lastUpdated)
        }))
        .sort((a, b) => parseFloat(b.Average_Rating) - parseFloat(a.Average_Rating)),
      headers: ['Faculty ID', 'Average Rating', 'Total Submissions', '7D Trend', '30D Trend', '90D Trend', 'Last Updated']
    });

    // Faculty Category Breakdown
    const categoryBreakdown = facultyStats.flatMap(stats =>
      Object.entries(stats.categoryScores).map(([category, score]) => ({
        Faculty_ID: stats.facultyId || '',
        Category: category,
        Average_Score: formatRating(score.average),
        Response_Count: score.count
      }))
    );

    sheets.push({
      name: 'Faculty Categories',
      data: categoryBreakdown,
      headers: ['Faculty ID', 'Category', 'Average Score', 'Response Count']
    });

    exportToExcel({
      filename: `Department_Report_${departmentName.replace(/\s+/g, '_')}`,
      sheets
    });
  };

  return (
    <Button
      variant="outline"
      onClick={generateReport}
      disabled={loading || facultyStats.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      Export Department Excel
    </Button>
  );
};