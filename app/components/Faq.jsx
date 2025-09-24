import {Text} from "@shopify/polaris";
import styles from "../routes/_index/styles.module.css";
export default function Faq({ faq_heading, Faq_ans}) {
 return (
   <div className={styles.faq}>
<Text as="h2"variant="headingMd">
    { faq_heading}
</Text>
<div>
{Faq_ans && (
        <div dangerouslySetInnerHTML={{ __html: Faq_ans }} />
      )}

</div>
   </div>
  );
}
