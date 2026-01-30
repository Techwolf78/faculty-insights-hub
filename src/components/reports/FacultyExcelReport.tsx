import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToExcel, formatDate, formatRating } from './excelUtils';
import { FeedbackStats } from '@/lib/storage';

interface FacultyExcelReportProps {
  facultyId: string;
  facultyName: string;
  stats: FeedbackStats | undefined;
  comments: Array<{
    text: string;
    rating: number;
    submittedAt: Date | string | { toDate(): Date };
  }>;
  loading?: boolean;
}

export const FacultyExcelReport: React.FC<FacultyExcelReportProps> = ({
  facultyId,
  facultyName,
  stats,
  comments,
  loading = false
}) => {
  const generateReport = () => {
    if (!stats) return;

    const sheets = [
      {
        name: 'Overview',
        data: [
          { Metric: 'Faculty Name', Value: facultyName },
          { Metric: 'Faculty ID', Value: facultyId },
          { Metric: 'Report Generated', Value: formatDate(new Date()) },
          { Metric: '', Value: '' },
          { Metric: 'Average Rating', Value: formatRating(stats.averageRating) },
          { Metric: 'Total Submissions', Value: stats.totalSubmissions },
          { Metric: 'Rating Trend (Last 7 days)', Value: stats.trend.last7Days },
          { Metric: 'Rating Trend (Last 30 days)', Value: stats.trend.last30Days },
          { Metric: 'Rating Trend (Last 90 days)', Value: stats.trend.last90Days },
        ],
        headers: ['Metric', 'Value']
      },
      {
        name: 'Category Scores',
        data: Object.entries(stats.categoryScores).map(([category, score]) => ({
          Category: category,
          Average_Score: formatRating(score.average),
          Response_Count: score.count
        })),
        headers: ['Category', 'Average Score', 'Response Count']
      },
      {
        name: 'Monthly Trends',
        data: Object.entries(stats.monthly).map(([month, data]) => ({
          Month: formatDate(new Date(month + '-01')),
          Submissions: data.submissions,
          Average_Rating: formatRating(data.averageRating)
        })).sort((a, b) => new Date(a.Month).getTime() - new Date(b.Month).getTime()),
        headers: ['Month', 'Submissions', 'Average Rating']
      },
      {
        name: 'Rating Distribution',
        data: Object.entries(stats.ratingDistribution).map(([rating, count]) => ({
          Rating: parseInt(rating),
          Count: count,
          Percentage: stats.totalSubmissions > 0 ? ((count / stats.totalSubmissions) * 100).toFixed(1) + '%' : '0%'
        })),
        headers: ['Rating', 'Count', 'Percentage']
      },
      {
        name: 'Recent Comments',
        data: comments.map(comment => ({
          Date: formatDate(comment.submittedAt),
          Rating: comment.rating,
          Comment: comment.text
        })),
        headers: ['Date', 'Rating', 'Comment']
      }
    ];

    exportToExcel({
      filename: `Faculty_Report_${facultyName.replace(/\s+/g, '_')}`,
      sheets
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generateReport}
      disabled={loading || !stats}
    >
      <Download className="h-4 w-4 mr-2" />
      Export Excel
    </Button>
  );
};