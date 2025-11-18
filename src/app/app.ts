import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { embedDashboard } from '@superset-ui/embedded-sdk';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  
  private intervalId: any;
  private currentUser = 'admin';
  private dashboardId = "078c015e-3464-46a3-b75b-0caefddafb6a"

  ngAfterViewInit() {
    const userSelect = document.getElementById('user-select') as HTMLSelectElement;
    const reloadBtn = document.getElementById('reload-btn') as HTMLButtonElement;
    const userNameSpan = document.getElementById('user-name');
    const rlsInfoSpan = document.getElementById('rls-info');

    reloadBtn?.addEventListener('click', () => {
      const selectedUser = userSelect?.value || 'admin';
      this.currentUser = selectedUser;

      if (userNameSpan) {
        userNameSpan.textContent = selectedUser;
      }

      if (rlsInfoSpan) {
        rlsInfoSpan.textContent = this.getRLSDescription(selectedUser);
      }

      this.reloadDashboard();
    });

    setTimeout(() => {
      this.loadDashboard();
    }, 100);
  }

  private getRLSDescription(username: string): string {
    const rlsMapping: Record<string, string> = {
      // Single conditions
      'john_usa': "country = 'USA'",
      'marie_france': "country = 'France'",
      'yuki_japan': "country = 'Japan'",
      'hans_germany': "country = 'Germany'",
      'sophia_spain': "country = 'Spain'",
      'manager_apac': "territory = 'APAC'",
      'manager_emea': "territory = 'EMEA'",
      'manager_japan': "territory = 'Japan'",
      'motorcycles_sales': "product_line = 'Motorcycles'",
      'classic_cars_sales': "product_line = 'Classic Cars'",
      'vintage_cars_sales': "product_line = 'Vintage Cars'",
      'trucks_buses_sales': "product_line = 'Trucks and Buses'",
      'planes_sales': "product_line = 'Planes'",
      'ships_sales': "product_line = 'Ships'",
      'trains_sales': "product_line = 'Trains'",
      'large_deals': "deal_size = 'Large'",
      'medium_deals': "deal_size = 'Medium'",
      'small_deals': "deal_size = 'Small'",

      // Multiple conditions (AND)
      'japan_motorcycles': "country = 'Japan' AND product_line = 'Motorcycles'",
      'usa_large': "country = 'USA' AND deal_size = 'Large'",
      'emea_classic_cars': "territory = 'EMEA' AND product_line = 'Classic Cars'",
      'france_large': "country = 'France' AND deal_size = 'Large'",

      // Multiple conditions (OR)
      'small_medium': "deal_size IN ('Small', 'Medium')",
      'vehicles_only': "product_line IN ('Motorcycles', 'Classic Cars', 'Vintage Cars', 'Trucks and Buses')",
      'transport_only': "product_line IN ('Planes', 'Ships', 'Trains')",

      // Admin
      'admin': 'No filters (All data)',
    };

    return rlsMapping[username] || 'Unknown user';
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private reloadDashboard() {
    // コンテナをクリア
    const container = document.getElementById('superset-container');
    if (container) {
      container.innerHTML = '';
    }
    
    // intervalをクリア
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // 再読み込み
    setTimeout(() => {
      this.loadDashboard();
    }, 100);
  }

  private async loadDashboard() {
    try {
      const container = document.getElementById('superset-container');
      
      if (!container) {
        console.error('Container not found!');
        return;
      }

      console.log(`Loading dashboard for user: ${this.currentUser}`);

      await embedDashboard({
        id: this.dashboardId,
        supersetDomain: 'http://localhost:8088',
        mountPoint: container,
        fetchGuestToken: () => this.fetchGuestToken(this.currentUser),
        dashboardUiConfig: {
          hideTitle: false,
          hideTab: false,
          hideChartControls: false,
        },
      });

      this.forceIframeSize();
      
    } catch (error) {
      console.error('Dashboard load error:', error);
    }
  }

  private forceIframeSize() {
    const container = document.getElementById('superset-container');
    if (!container) return;

    const setSize = () => {
      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.style.width = window.innerWidth + 'px';
        iframe.style.height = window.innerHeight + 'px';
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.border = 'none';
      }
    };

    this.intervalId = setInterval(setSize, 100);
    window.addEventListener('resize', setSize);
    setSize();
  }

  private async fetchGuestToken(username: string): Promise<string> {
    console.log('🔑 fetchGuestToken called for:', username);

    const response = await fetch('http://localhost:3000/api/superset/guest-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': username,
      },
      body: JSON.stringify({
        dashboardId: this.dashboardId,
        username: username,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch guest token: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Guest token received:', data.token.substring(0, 50) + '...');
    return data.token;
  }
}