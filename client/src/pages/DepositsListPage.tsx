import React from 'react';
import styles from './StaticPage.module.css';

const DepositsListPage: React.FC = () => (
  <div className={styles.container}>
    <h1 className={styles.title}>Deposits List</h1>
    <p className={styles.subtitle}>
      This is a static deposits list page. No data is loaded from the backend.
    </p>
    <div className={styles.empty}>
      No deposits available.
    </div>
  </div>
);

export default DepositsListPage;
