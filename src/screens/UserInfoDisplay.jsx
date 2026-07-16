import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const UserInfoDisplay = ({ data }) => {
  // Handle array input - if data is an array, use the first element
  const userData = Array.isArray(data) ? data[0] : data;
  
  if (!userData) return null;

  // Helper to parse JSON strings
  const parseIfNeeded = (value) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed;
      } catch (e) {
        return value;
      }
    }
    return value;
  };

  // Format skills display - show only skill names
  const formatSkills = (skills) => {
    if (!skills || skills === '[]') return null;
    const parsed = parseIfNeeded(skills);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    
    return parsed.map(skill => {
      if (typeof skill === 'object' && skill !== null) {
        return skill.skillName || skill.name;
      }
      return skill;
    }).join(', ');
  };

  // Format education display
  const formatEducation = (education) => {
    if (!education || education === '[]') return null;
    const parsed = parseIfNeeded(education);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    
    return parsed.map(edu => {
      if (typeof edu === 'object' && edu !== null) {
        const parts = [];
        if (edu.educationLevel) parts.push(edu.educationLevel);
        if (edu.institutionName) parts.push(`at ${edu.institutionName}`);
        if (edu.passingYear) parts.push(`(${edu.passingYear})`);
        return parts.join(' ');
      }
      return edu;
    }).join('\n');
  };

  // Format work history display
  const formatWorkHistory = (workHistory) => {
    if (!workHistory || workHistory === '[]') return null;
    const parsed = parseIfNeeded(workHistory);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    
    return parsed.map(work => {
      if (typeof work === 'object' && work !== null) {
        return {
          projectName: work.projectName,
          workType: work.workType,
          workPlace: work.workPlace,
          employer: work.employeeName,
          duration: `${work.startDate} to ${work.endDate}`,
          daysWorked: work.daysWorked,
          dailyWage: work.dailyWage,
          totalAmount: work.totalAmount,
          paymentStatus: work.paymentStatus,
          rating: work.rating,
          taskDescription: work.taskDescription,
          remarks: work.remarks,
          skills: work.skillName ? (Array.isArray(work.skillName) ? work.skillName.join(', ') : work.skillName) : null
        };
      }
      return work;
    });
  };

  // Basic Information Section (Priority 1)
  const basicInfo = {
    'Full Name': userData.full_name,
    'User Type': userData.user_type,
    'Mobile Number': userData.mobile_number,
    'Email': userData.email,
    'Gender': userData.gender,
    'Date of Birth': userData.date_of_birth,
  };

  // Location Information Section (Priority 2)
  const locationInfo = {
    'District': userData.dist_name,
    'Mandal': userData.mandal_name,
    'Village': userData.village_name,
    'Address': `${userData.plot_or_house_number || ''}${userData.landmark ? ', ' + userData.landmark : ''}`,
    'Pincode': userData.pincode,
  };

  // Skills Information Section (Priority 3)
  const skills = formatSkills(userData.skills);
  const skillInfo = {
    'Skills': skills,
    'Experience Years': userData.skill_experience_years,
    'Daily Rate': userData.skill_daily_rate ? `₹${userData.skill_daily_rate}` : null,
    'Preferred Work Type': userData.skill_preferred_work_type,
  };

  // Employment & Documents Section (Priority 4)
  const employmentInfo = {
    'Employer Type': userData.employer_type_name,
    'Avg Workers/Month': userData.average_workers_hired_per_month,
    'Document Type': userData.document_type,
    'Document Number': userData.document_number,
    'Labour Licence': userData.labour_licence,
    'E-Shram Card': userData.e_shram_card_number,
  };

  // Education Section (Priority 5)
  const education = formatEducation(userData.education);

  // Work History Section (Priority 6)
  const workHistoryList = formatWorkHistory(userData.work_history);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        
        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {Object.entries(basicInfo).map(([label, value]) => {
            if (value === null || value === undefined || value === '') return null;
            return (
              <View key={label} style={styles.row}>
                <Text style={styles.label}>{label}:</Text>
                <Text style={styles.value}>{String(value)}</Text>
              </View>
            );
          })}
        </View>

        {/* Location Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Information</Text>
          {Object.entries(locationInfo).map(([label, value]) => {
            if (value === null || value === undefined || value === '') return null;
            return (
              <View key={label} style={styles.row}>
                <Text style={styles.label}>{label}:</Text>
                <Text style={styles.value}>{String(value)}</Text>
              </View>
            );
          })}
        </View>

        {/* Skills Section */}
        {skills && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills & Experience</Text>
            {Object.entries(skillInfo).map(([label, value]) => {
              if (value === null || value === undefined || value === '') return null;
              return (
                <View key={label} style={styles.row}>
                  <Text style={styles.label}>{label}:</Text>
                  <Text style={[styles.value, styles.skillsValue]}>{String(value)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Employment & Documents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employment & Documents</Text>
          {Object.entries(employmentInfo).map(([label, value]) => {
            if (value === null || value === undefined || value === '') return null;
            return (
              <View key={label} style={styles.row}>
                <Text style={styles.label}>{label}:</Text>
                <Text style={styles.value}>{String(value)}</Text>
              </View>
            );
          })}
        </View>

        {/* Education Section */}
        {education && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Qualifications:</Text>
              <Text style={[styles.value, styles.multilineValue]}>{education}</Text>
            </View>
          </View>
        )}

        {/* Work History Section */}
        {workHistoryList && workHistoryList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work History</Text>
            {workHistoryList.map((work, index) => (
              <View key={index} style={styles.workCard}>
                <Text style={styles.workTitle}>{work.projectName}</Text>
                <View style={styles.workRow}>
                  <Text style={styles.workLabel}>Work Type:</Text>
                  <Text style={styles.workValue}>{work.workType}</Text>
                </View>
                <View style={styles.workRow}>
                  <Text style={styles.workLabel}>Employer:</Text>
                  <Text style={styles.workValue}>{work.employer}</Text>
                </View>
                <View style={styles.workRow}>
                  <Text style={styles.workLabel}>Location:</Text>
                  <Text style={styles.workValue}>{work.workPlace}</Text>
                </View>
                <View style={styles.workRow}>
                  <Text style={styles.workLabel}>Duration:</Text>
                  <Text style={styles.workValue}>{work.duration}</Text>
                </View>
                <View style={styles.workRow}>
                  <Text style={styles.workLabel}>Days Worked:</Text>
                  <Text style={styles.workValue}>{work.daysWorked} days</Text>
                </View>
                <View style={styles.workRow}>
                  <Text style={styles.workLabel}>Wage:</Text>
                  <Text style={styles.workValue}>₹{work.dailyWage}/day</Text>
                </View>
                <View style={styles.workRow}>
                  <Text style={styles.workLabel}>Total Amount:</Text>
                  <Text style={styles.workValue}>₹{work.totalAmount}</Text>
                </View>
                <View style={styles.workRow}>
                  <Text style={styles.workLabel}>Payment Status:</Text>
                  <Text style={[styles.workValue, work.paymentStatus === 'paid' ? styles.paidStatus : styles.pendingStatus]}>
                    {work.paymentStatus}
                  </Text>
                </View>
                <View style={styles.workRow}>
                  <Text style={styles.workLabel}>Rating:</Text>
                  <Text style={styles.workValue}>{'★'.repeat(work.rating)}{'☆'.repeat(5-work.rating)} ({work.rating}/5)</Text>
                </View>
                {work.skills && (
                  <View style={styles.workRow}>
                    <Text style={styles.workLabel}>Skills Used:</Text>
                    <Text style={styles.workValue}>{work.skills}</Text>
                  </View>
                )}
                {work.taskDescription && (
                  <View style={styles.workRow}>
                    <Text style={styles.workLabel}>Description:</Text>
                    <Text style={styles.workValue}>{work.taskDescription}</Text>
                  </View>
                )}
                {work.remarks && (
                  <View style={styles.workRow}>
                    <Text style={styles.workLabel}>Remarks:</Text>
                    <Text style={styles.workValue}>{work.remarks}</Text>
                  </View>
                )}
                {index < workHistoryList.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    width: '35%',
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  value: {
    width: '65%',
    fontSize: 14,
    color: '#333',
  },
  skillsValue: {
    flexWrap: 'wrap',
  },
  multilineValue: {
    lineHeight: 20,
  },
  workCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 6,
  },
  workTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  workRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 4,
  },
  workLabel: {
    width: '30%',
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  workValue: {
    width: '70%',
    fontSize: 13,
    color: '#333',
  },
  paidStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  pendingStatus: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
});

export default UserInfoDisplay;