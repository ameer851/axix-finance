import React from 'react';
import styles from './StaticPage.module.css';

const WithdrawalsHistoryPage: React.FC = () => (
  <div className={styles.container}>
    <h1 className={styles.title}>Withdrawals History</h1>
    <p className={styles.subtitle}>
      This is a static withdrawals history page. No data is loaded from the backend.
    </p>
    <div className={styles.empty}>
      No withdrawal history available.
    </div>
  </div>
);

export default WithdrawalsHistoryPage;
