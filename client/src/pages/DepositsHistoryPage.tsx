import React from 'react';
import styles from './StaticPage.module.css';

const DepositsHistoryPage: React.FC = () => (
  <div className={styles.container}>
    <h1 className={styles.title}>Deposits History</h1>
    <p className={styles.subtitle}>
      This is a static deposits history page. No data is loaded from the backend.
    </p>
    <div className={styles.empty}>
      No deposit history available.
    </div>
  </div>
);

export default DepositsHistoryPage;
