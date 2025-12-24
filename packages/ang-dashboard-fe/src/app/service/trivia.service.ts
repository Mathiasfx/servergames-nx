import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Question {
  question: string;
  options: string[];
  answer: string;
}

export interface CreateTriviaDto {
  title: string;
  questions: Question[];
}

export interface Trivia {
  id: string;
  userId: string;
  title: string;
  questions: Question[];
  isActive: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TriviaService {
  private apiUrl = 'http://localhost:3007/api/rooms/trivias'; // Backend corriendo en puerto 3007

  private readonly http = inject(HttpClient);

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  createTrivia(trivia: CreateTriviaDto): Observable<Trivia> {
    return this.http.post<Trivia>(this.apiUrl, trivia, {
      headers: this.getAuthHeaders()
    });
  }

  getMyTrivia(): Observable<Trivia> {
    return this.http.get<Trivia>(`${this.apiUrl}/mine`, {
      headers: this.getAuthHeaders()
    });
  }

  updateTrivia(id: string, trivia: Partial<CreateTriviaDto>): Observable<Trivia> {
    return this.http.put<Trivia>(`${this.apiUrl}/${id}`, trivia, {
      headers: this.getAuthHeaders()
    });
  }

  deleteTrivia(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  startTrivia(id: string): Observable<Trivia> {
    return this.http.post<Trivia>(`${this.apiUrl}/${id}/start`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getRanking(id: string): Observable<unknown> {
    return this.http.get<unknown>(`${this.apiUrl}/${id}/ranking`, {
      headers: this.getAuthHeaders()
    });
  }
}
