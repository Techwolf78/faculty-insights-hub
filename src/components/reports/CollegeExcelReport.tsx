import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToExcel, formatDate, formatRating } from './excelUtils';
import { FeedbackStats } from '@/lib/storage';

interface CollegeExcelReportProps {
  collegeName: string;
  collegeStats?: FeedbackStats;
  departmentStats: FeedbackStats[];
  facultyStats: FeedbackStats[];
  loading?: boolean;
}

export const CollegeExcelReport: React.FC<CollegeExcelReportProps> = ({
  collegeName,
  collegeStats,
  departmentStats,
  facultyStats,
  loading = false
}) => {
  const generateReport = () => {
    const sheets = [];

    // College Overview Sheet
    if (collegeStats) {
      sheets.push({
        name: 'College Overview',
        data: [
          { Metric: 'College', Value: collegeName },
          { Metric: 'Report Generated', Value: formatDate(new Date()) },
          { Metric: 'Total Departments', Value: departmentStats.length },
          { Metric: 'Total Faculty', Value: facultyStats.length },
          { Metric: '', Value: '' },
          { Metric: 'College Average Rating', Value: formatRating(collegeStats.averageRating) },
          { Metric: 'Total Submissions', Value: collegeStats.totalSubmissions },
          { Metric: 'Rating Trend (Last 7 days)', Value: collegeStats.trend.last7Days },
          { Metric: 'Rating Trend (Last 30 days)', Value: collegeStats.trend.last30Days },
          { Metric: 'Rating Trend (Last 90 days)', Value: collegeStats.trend.last90Days },
        ],
        headers: ['Metric', 'Value']
      });

      // College Category Scores
      sheets.push({
        name: 'College Categories',
        data: Object.entries(collegeStats.categoryScores).map(([category, score]) => ({
          Category: category,
          Average_Score: formatRating(score.average),
          Response_Count: score.count
        })),
        headers: ['Category', 'Average Score', 'Response Count']
      });
    }

    // Department Performance Sheet
    sheets.push({
      name: 'Department Performance',
      data: departmentStats
        .map(stats => ({
          Department_ID: stats.departmentId || '',
          Average_Rating: formatRating(stats.averageRating),
          Total_Submissions: stats.totalSubmissions,
          Faculty_Count: facultyStats.filter(f => f.departmentId === stats.departmentId).length,
          Rating_Trend_7D: stats.trend.last7Days,
          Rating_Trend_30D: stats.trend.last30Days,
          Rating_Trend_90D: stats.trend.last90Days,
          Last_Updated: formatDate(stats.lastUpdated)
        }))
        .sort((a, b) => parseFloat(b.Average_Rating) - parseFloat(a.Average_Rating)),
      headers: ['Department ID', 'Average Rating', 'Total Submissions', 'Faculty Count', '7D Trend', '30D Trend', '90D Trend', 'Last Updated']
    });

    // Faculty Performance Sheet
    sheets.push({
      name: 'Faculty Performance',
      data: facultyStats
        .map(stats => ({
          Faculty_ID: stats.facultyId || '',
          Department_ID: stats.departmentId || '',
          Average_Rating: formatRating(stats.averageRating),
          Total_Submissions: stats.totalSubmissions,
          Rating_Trend_7D: stats.trend.last7Days,
          Rating_Trend_30D: stats.trend.last30Days,
          Rating_Trend_90D: stats.trend.last90Days,
          Last_Updated: formatDate(stats.lastUpdated)
        }))
        .sort((a, b) => parseFloat(b.Average_Rating) - parseFloat(a.Average_Rating)),
      headers: ['Faculty ID', 'Department ID', 'Average Rating', 'Total Submissions', '7D Trend', '30D Trend', '90D Trend', 'Last Updated']
    });

    // Top/Bottom Performers
    const topPerformers = facultyStats
      .filter(f => f.averageRating > 0)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 10)
      .map((stats, index) => ({
        Rank: index + 1,
        Faculty_ID: stats.facultyId || '',
        Average_Rating: formatRating(stats.averageRating),
        Total_Submissions: stats.totalSubmissions
      }));

    sheets.push({
      name: 'Top Performers',
      data: topPerformers,
      headers: ['Rank', 'Faculty ID', 'Average Rating', 'Total Submissions']
    });

    exportToExcel({
      filename: `College_Report_${collegeName.replace(/\s+/g, '_')}`,
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
      Export College Excel
    </Button>
  );
};