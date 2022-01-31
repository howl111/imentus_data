import {Link} from 'react-router-dom';

export const Drawer = () => {
    return <nav class="drawer fixedwidth nav flex-column">
    <Link class="nav-link" to="/collections">Collections</Link>
    <Link class="nav-link" to="/coins">Coins</Link>
    <Link class="nav-link" to="/stake">Stake</Link>
  </nav>
}